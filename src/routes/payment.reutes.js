import express from 'express';
import Stripe from 'stripe';
import { Compra } from "../models/Pedidos.model.js";
import { Producto } from '../models/productos.model.js';
import { Tienda } from '../models/plan.model.js';
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Usa variabrrle de entorno

// Crear un Payment Intent
router.post('/payments', async (req, res) => {
  try {
    const { token } = req.cookies;

    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({ message: "Token no proporcionado." });
    }

    let usuarioId;
    try {
      // Decodificar el token
      const decodedToken = jwt.verify(token, TOKEN_SECRET);
      usuarioId = decodedToken.id;
    } catch (error) {
      return res.status(401).json({ message: "Token no válido o expirado." });
    }

    const { productos, metodoPago, paymentDetails, direccionEnvio } = req.body;

    // Validar datos necesarios
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "No se enviaron productos para la compra." });
    }

    if (!direccionEnvio) {
      return res.status(400).json({ message: "La dirección de envío es obligatoria." });
    }

    let totalCompra = 0;
    const productosCompra = [];

    for (const item of productos) {
      // Buscar producto en la base de datos
      const producto = await Producto.findById(item.productoId);
      if (!producto) {
        return res.status(404).json({ message: `Producto con ID ${item.productoId} no existe.` }), console.log({ message: `Producto con ID ${item.productoId} no existe.` })
      }

      // Verificar disponibilidad de stock
      if (producto.cantidad < item.cantidad) {
        return res.status(400).json({
          message: `Stock insuficiente para "${producto.nombre}". Disponibles: ${producto.cantidad}.`,
        });
      }

      // Actualizar stock y calcular subtotal
      producto.cantidad -= item.cantidad;
      await producto.save();

      const subtotal = producto.precio * item.cantidad;
      totalCompra += subtotal;

      productosCompra.push({
        productoId: producto._id,
        tiendaId: producto.tiendaId,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal,
      });
    }

    let paymentIntent;

    if (metodoPago === "tarjeta") {
      // Validar que la tienda tenga cuenta financiera configurada
      const vendedor = await Tienda.findById(productosCompra[0].tiendaId);
      const sellerId = vendedor.stripeAccountId || "acct_1QORwpPAYrTft3XD"; // Reemplazar con la lógica correcta
      if (!sellerId) {
        return res.status(400).json({
          message: "La tienda no tiene una cuenta financiera configurada.",
        });
      }

      try {
        // Crear Payment Intent en Stripe
        paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(totalCompra * 100),
          currency: "mxn",
          payment_method: paymentDetails.paymentMethodId,
          confirm: true,
          return_url: "http://localhost:5173/exito", // URL donde redirigir tras el pago
          transfer_data: {
            destination: sellerId,
          },
          metadata: {
            usuarioId,
            direccionEnvio,
            totalCompra,
          },
        });
        
        
      } catch (error) {
        console.error("Error al crear el Payment Intent:", error.message);
        return res.status(500).json({ message: "No se pudo crear el Payment Intent en Stripe." });
      }

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          message: "El pago no se pudo completar. Estado: " + paymentIntent.status,
        });
      }
    }

    // Guardar la compra en la base de datos
    const nuevaCompra = new Compra({
      usuarioId,
      productos: productosCompra,
      metodoPago,
      direccionEnvio,
      totalCompra,
      paymentIntentId: metodoPago === "tarjeta" ? paymentIntent.id : null,
    });

    const compraGuardada = await nuevaCompra.save();

    res.status(201).json({
      message: "Compra realizada con éxito.",
      clientSecret: metodoPago === "tarjeta" ? paymentIntent.client_secret : null,
      compra: compraGuardada,
    });
  } catch (error) {
    console.error("Error en registrarPedido:", error.message);
    res.status(500).json({ message: "Error al realizar la compra.", error: error.message });
  }
});

// Obtener detalles de los Payment Intents
router.get('/api/payments', async (req, res) => {
  try {
    const paymentIntents = await stripe.paymentIntents.list({ limit: 10 });

    const payments = paymentIntents.data.map((intent) => ({
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      receipt_email: intent.receipt_email,
      metadata: intent.metadata,
      created: new Date(intent.created * 1000),
    }));

    res.json(payments);
  } catch (error) {
    console.error("Error al obtener los Payment Intents:", error.message);
    res.status(500).json({ message: "Error al obtener los Payment Intents." });
  }
});


router.get('/pedidos/tienda', async (req, res) => {
  try {
    const { tiendaToken } = req.cookies;

    // Verificar si el token de la tienda está presente
    if (!tiendaToken) {
      return res.status(401).json({ message: "Token de tienda no proporcionado." });
    }

    let tiendaId;

    try {
      // Decodificar el token
      const decodedToken = jwt.verify(tiendaToken, TOKEN_SECRET); // Reemplaza TOKEN_SECRET con tu clave secreta real
      tiendaId = decodedToken.id; // Asegúrate de que el token contiene el campo tiendaIde
      console.log(tiendaId);
    } catch (error) {
      return res.status(401).json({ message: "Token no válido o expirado." });
    }

    // Verificar si el tiendaId está presente en el token
    if (!tiendaId) {
      return res.status(400).json({ message: "El ID de la tienda no está presente en el token." });
    }

    // Buscar pedidos que contengan productos relacionados con la tienda
    const pedidos = await Compra.find({ "productos.tiendaId": tiendaId });

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: "No se encontraron pedidos para esta tienda." });
    }

    res.status(200).json({
      message: "Pedidos encontrados con éxito.",
      pedidos,
    });
  } catch (error) {
    console.error("Error al obtener pedidos por tiendaId:", error.message);
    res.status(500).json({ message: "Error al obtener los pedidos.", error: error.message });
  }
});
 
router.get('/pedidos/tienda/total', async (req, res) => {
  try {
    const { tiendaToken } = req.cookies;

    // Verificar si el token de la tienda está presente
    if (!tiendaToken) {
      return res.status(401).json({ message: "Token de tienda no proporcionado." });
    }

    let tiendaId;

    try {
      // Decodificar el token
      const decodedToken = jwt.verify(tiendaToken, TOKEN_SECRET); // Reemplaza TOKEN_SECRET con tu clave secreta real
      tiendaId = decodedToken.id; // Asegúrate de que el token contiene el campo tiendaId
    } catch (error) {
      return res.status(401).json({ message: "Token no válido o expirado." });
    }

    // Verificar si el tiendaId está presente en el token
    if (!tiendaId) {
      return res.status(400).json({ message: "El ID de la tienda no está presente en el token." });
    }

    // Buscar pedidos que contengan productos relacionados con la tienda
    const pedidos = await Compra.find({ "productos.tiendaId": tiendaId });

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: "No se encontraron pedidos para esta tienda." });
    }

    // Calcular el total de ingresos de la tienda
    const totalTienda = pedidos.reduce((total, pedido) => {
      const totalPorPedido = pedido.productos
        .filter(producto => producto.tiendaId.toString() === tiendaId)
        .reduce((subtotal, producto) => subtotal + producto.subtotal, 0);
      return total + totalPorPedido;
    }, 0);

    res.status(200).json({
      message: "Total calculado con éxito.",
      tiendaId,
      totalTienda,
    });
  } catch (error) {
    console.error("Error al calcular el total de la tienda:", error.message);
    res.status(500).json({ message: "Error al calcular el total.", error: error.message });
  }
});

router.get('/pedidos/tienda/producto-mas-vendido', async (req, res) => {
  try {
    const { tiendaToken } = req.cookies;

    // Verificar si el token de la tienda está presente
    if (!tiendaToken) {
      return res.status(401).json({ message: "Token de tienda no proporcionado." });
    }

    let tiendaId;

    try {
      // Decodificar el token
      const decodedToken = jwt.verify(tiendaToken, TOKEN_SECRET); // Reemplaza TOKEN_SECRET con tu clave secreta real
      tiendaId = decodedToken.id; // Asegúrate de que el token contiene el campo tiendaId
    } catch (error) {
      return res.status(401).json({ message: "Token no válido o expirado." });
    }

    // Verificar si el tiendaId está presente en el token
    if (!tiendaId) {
      return res.status(400).json({ message: "El ID de la tienda no está presente en el token." });
    }

    // Buscar pedidos que contengan productos relacionados con la tienda
    const pedidos = await Compra.find({ "productos.tiendaId": tiendaId });

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: "No se encontraron pedidos para esta tienda." });
    }

    // Calcular el producto más vendido
    const productosVendidos = {};

    pedidos.forEach((pedido) => {
      pedido.productos.forEach((producto) => {
        if (producto.tiendaId.toString() === tiendaId) {
          const { productoId, cantidad } = producto;
          if (!productosVendidos[productoId]) {
            productosVendidos[productoId] = { productoId, cantidad: 0 };
          }
          productosVendidos[productoId].cantidad += cantidad;
        }
      });
    });

    // Encontrar el producto con mayor cantidad vendida
    const productoMasVendido = Object.values(productosVendidos).reduce((max, producto) =>
      producto.cantidad > max.cantidad ? producto : max,
    );

    if (!productoMasVendido) {
      return res.status(404).json({ message: "No se encontró un producto más vendido." });
    }

    // Obtener los detalles del producto más vendido
    const detallesProducto = await Producto.findById(productoMasVendido.productoId);

    if (!detallesProducto) {
      return res.status(404).json({ message: "El producto más vendido no se encuentra en la base de datos." });
    }

    res.status(200).json({
      message: "Producto más vendido encontrado con éxito.",
      producto: {
        ...detallesProducto.toObject(),
        cantidadVendida: productoMasVendido.cantidad,
      },
    });
  } catch (error) {
    console.error("Error al obtener el producto más vendido:", error.message);
    res.status(500).json({ message: "Error al obtener el producto más vendido.", error: error.message });
  }
});

router.get('/pedidos/usuario', async (req, res) => {
  try {
    const { token } = req.cookies;

    // Verificar si el token del usuario está presente
    if (!token) {
      return res.status(401).json({ message: "Token de usuario no proporcionado." });
    }

    let usuarioId;

    try {
      // Decodificar el token
      const decodedToken = jwt.verify(token, TOKEN_SECRET);
      usuarioId = decodedToken.id; // Asegúrate de que el token contiene el campo `id` del usuario
    } catch (error) {
      return res.status(401).json({ message: "Token no válido o expirado." });
    }

    // Verificar si el usuarioId está presente en el token
    if (!usuarioId) {
      return res.status(400).json({ message: "El ID del usuario no está presente en el token." });
    }

    // Buscar pedidos relacionados con el usuario
    const pedidos = await Compra.find({ usuarioId }).populate('productos.productoId');

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ message: "No se encontraron pedidos para este usuario." });
    }

    res.status(200).json({
      message: "Pedidos encontrados con éxito.",
      pedidos,
    });
  } catch (error) {
    console.error("Error al obtener pedidos por usuarioId:", error.message);
    res.status(500).json({ message: "Error al obtener los pedidos.", error: error.message });
  }
});



router.get('/suscripcion', async (req, res) => {
  try {
    // Obtener el ID del propietario desde el token en las cookies
    const { tiendaToken } = req.cookies;
    if (!tiendaToken) return res.status(401).json({ message: "Autenticación requerida" });

    const decoded = jwt.verify(tiendaToken, TOKEN_SECRET);
    const tiendaId = decoded.id; 

    // Buscar la tienda del propietario en la base de datos
    const tiendaGuardada = await Tienda.findById(tiendaId);
    const tienda = tiendaGuardada;
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    // Validar si existe una fecha de expiración de suscripción
    if (!tienda.subscriptionExpirationDate) {
      return res.status(400).json({ message: "La suscripción aún no está activa" });
    }

    // Calcular los días restantes de la suscripción
    const expirationDate = new Date(tienda.subscriptionExpirationDate);
    const daysRemaining = Math.ceil((expirationDate - Date.now()) / (1000 * 60 * 60 * 24));

    // Responder con los días restantes y el estado actual
    res.json({
      tienda: {
        id: tienda._id,
        nombre: tienda.nombre,
        email: tienda.email,
        subscriptionStatus: tienda.subscription_status,
        subscriptionExpirationDate: tienda.subscriptionExpirationDate,
        subscriptionDaysRemaining: daysRemaining > 0 ? daysRemaining : 0, // Evitar negativos
      },
    });
  } catch (error) {
    console.error("Error al obtener el estado de la suscripción:", error);
    res.status(500).json({ message: "Error al obtener el estado de la suscripción" });
  }
});




export default router;