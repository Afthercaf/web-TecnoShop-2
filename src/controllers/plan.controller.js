import { Tienda } from "../models/plan.model.js";
import { User } from "../models/user.model.js";
import { Producto } from "../models/productos.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { TOKEN_SECRET, STRIPE_SECRET_KEY } from "../config.js";

import { createAccessToken } from "../libs/jwt.js";
import Stripe from "stripe";



export const insertarPlan = async (req, res) => {
    try {
      const { id } = req.params;
      const { inicio, fin, tipo } = req.body;
  
      const tienda = await Tienda.findById(id);
      if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });
  
      if (!tienda.plan) tienda.plan = [];
      tienda.plan.push({ inicio, fin, tipo });
  
      await tienda.save();
      res.status(201).json({ message: "Plan agregado exitosamente", plan: tienda.plan });
    } catch (error) {
      res.status(500).json({ message: "Error al insertar el plan", error: error.message });
    }
  };

// Asignar un plan a una tienda
export const asignarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, duracion } = req.body;

    const tienda = await Tienda.findById(id);
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    const fechaInicio = new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + duracion);

    tienda.plan = {
      tipo,
      inicio: fechaInicio,
      fin: fechaFin,
    };

    await tienda.save();

    res.json({
      message: "Plan asignado correctamente",
      plan: tienda.plan,
    });
  } catch (error) {
    console.error("Error al asignar el plan:", error);
    res.status(500).json({ message: "Error al asignar el plan" });
  }
};

// Verificar el estado del plan de una tienda
export const verificarPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const tienda = await Tienda.findById(id);
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    const hoy = new Date();
    if (!tienda.plan || hoy > tienda.plan.fin) {
      return res.json({
        message: "El plan ha expirado o no existe",
        plan: tienda.plan || null,
      });
    }

    res.json({
      message: "El plan está activo",
      plan: tienda.plan,
    });
  } catch (error) {
    console.error("Error al verificar el plan:", error);
    res.status(500).json({ message: "Error al verificar el plan" });
  }
};

// Actualizar el plan de una tienda
export const actualizarPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, duracion } = req.body;

    const tienda = await Tienda.findById(id);
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    const fechaInicio = new Date();
    const fechaFin = new Date(fechaInicio);
    fechaFin.setDate(fechaInicio.getDate() + duracion);

    tienda.plan = {
      tipo,
      inicio: fechaInicio,
      fin: fechaFin,
    };

    await tienda.save();

    res.json({
      message: "Plan actualizado correctamente",
      plan: tienda.plan,
    });
  } catch (error) {
    console.error("Error al actualizar el plan:", error);
    res.status(500).json({ message: "Error al actualizar el plan" });
  }
};

// Obtener detalles del plan de una tienda
export const obtenerPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const tienda = await Tienda.findById(id);
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    res.json({
      plan: tienda.plan,
    });
  } catch (error) {
    console.error("Error al obtener el plan:", error);
    res.status(500).json({ message: "Error al obtener el plan" });
  }
};


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import Joi from 'joi';

export const registerTienda = async (req, res) => {
  try {
    const { nombre, email, password, logo, telefono, direccion } = req.body;

    // Verifica el token de usuario
    const { token } = req.cookies;
    if (!token) return res.status(401).json({ message: "Autenticación requerida" });

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const propietarioId = decoded.id;

    // Verificar si el email ya está en uso
    const tiendaExistente = await Tienda.findOne({ email });
    if (tiendaExistente) {
      return res.status(400).json({ message: "El email ya está en uso" });
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear cliente de Stripe
    const customer = await stripe.customers.create({
      email,
      name: nombre,
      description: "Cliente de Tienda TecnoShop",
    });

    // Crear cuenta de Stripe
    const account = await stripe.accounts.create({
      type: "standard",
      country: "MX",
      email,
    });

    // Generar enlace de onboarding
    const onboardingLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "http://localhost:5173/reintentar",
      return_url: "http://localhost:5173/exito",
      type: "account_onboarding",
    });

    // Guardar tienda en la base de datos con el enlace de pago y onboarding
    const paymentLink = "https://buy.stripe.com/test_cN24jX6JRdVbgWk288";
    const nuevaTienda = new Tienda({
      nombre,
      email,
      password: passwordHash,
      propietarioId,
      logo,
      telefono,
      direccion,
      stripeCustomerId: customer.id,
      stripeAccountId: account.id,
      paymentLink,
      onboardingLink: onboardingLink.url,
      subscription_status: "pending", // Inicia en estado pendiente
    });

    const tiendaGuardada = await nuevaTienda.save();

    // Actualizar el usuario a tipo vendedor
    const usuarioActualizado = await User.findByIdAndUpdate(
      propietarioId,
      { tipo: "vendedor" },
      { new: true }
    );

    // Crear la suscripción con un mes gratis
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: 'mxn',
            product: 'prod_RK0FwgrrHGfIGK', // Debes reemplazar con el ID de tu producto
            recurring: {
              interval: 'month',
            },
            unit_amount: 6000, // 60 MXN por mes
          },
        },
      ],
      trial_period_days: 30, // Establecer prueba gratuita de 30 días
    });

    // Calcular la fecha de vencimiento
    const expirationDate = new Date(subscription.current_period_end * 1000); // Stripe usa timestamp en segundos
    const daysRemaining = Math.ceil((expirationDate - Date.now()) / (1000 * 60 * 60 * 24)); // Días restantes

    // Actualizar la tienda con el ID de la suscripción, el estado y los detalles de la suscripción
    tiendaGuardada.subscription_status = "active";
    tiendaGuardada.subscriptionId = subscription.id;
    tiendaGuardada.subscriptionExpirationDate = expirationDate;
    tiendaGuardada.subscriptionDaysRemaining = daysRemaining;
    tiendaGuardada.save();

    // Respuesta al cliente con los detalles
    res.json({
      tienda: {
        id: tiendaGuardada._id,
        nombre: tiendaGuardada.nombre,
        email: tiendaGuardada.email,
        propietarioId: tiendaGuardada.propietarioId,
        paymentLink: tiendaGuardada.paymentLink,
        onboardingLink: tiendaGuardada.onboardingLink,
        subscriptionStatus: tiendaGuardada.subscription_status,
        subscriptionExpirationDate: tiendaGuardada.subscriptionExpirationDate,
        subscriptionDaysRemaining: tiendaGuardada.subscriptionDaysRemaining,
      },
      usuario: {
        id: usuarioActualizado._id,
        username: usuarioActualizado.username,
        email: usuarioActualizado.email,
        tipo: usuarioActualizado.tipo,
      },
    });
  } catch (error) {
    console.error("Error en el registro de tienda:", error);
    res.status(500).json({ message: "Error al registrar la tienda" });
  }
};




export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;

        // Actualizar estado de la tienda cuando el pago se complete
        await Tienda.updateOne(
          { stripeCustomerId: session.customer },
          {
            subscription_status: "active",
            plan_start_date: new Date(),
            plan_end_date: new Date(session.expires_at * 1000),
          }
        );
        console.log("Suscripción completada y actualizada.");
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;

        // Manejar fallos de pago
        await Tienda.updateOne(
          { stripeCustomerId: invoice.customer },
          { subscription_status: "past_due" }
        );
        console.log("Fallo en el pago registrado.");
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;

        // Manejar cancelaciones de suscripción
        await Tienda.updateOne(
          { stripeCustomerId: subscription.customer },
          { subscription_status: "canceled" }
        );
        console.log("Suscripción cancelada.");
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error en el webhook:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};



const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY)
// Ver el estado de la suscripción
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { tiendaId } = req.params;
    const tienda = await Tienda.findById(tiendaId);
  console.log(tienda.subscriptionId);
    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    const subscription = await stripeClient.subscriptions.retrieve(tienda.subscriptionId);

    res.json({
      status: subscription.status,
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end,
    });
  } catch (error) {
    console.error("Error al obtener el estado de la suscripción:", error);
    res.status(500).json({ message: "Error al obtener el estado de la suscripción" });
  }}

  // Cancelar la suscripción
export const cancelSubscription = async (req, res) => {
  try {
    const { tiendaId } = req.params;
    const tienda = await Tienda.findById(tiendaId);

    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    // Cancelar la suscripción en Stripe
    const subscription = await stripeClient.subscriptions.del(tienda.subscriptionId);

    // Actualizar la tienda en la base de datos
    tienda.subscription_status = "canceled";
    await tienda.save();

    res.json({ message: "Suscripción cancelada correctamente" });
  } catch (error) {
    console.error("Error al cancelar la suscripción:", error);
    res.status(500).json({ message: "Error al cancelar la suscripción" });
  }
};

// Pagar la suscripción después de la prueba gratuita
export const paySubscription = async (req, res) => {
  try {
    const { tiendaId } = req.params;
    const tienda = await Tienda.findById(tiendaId);

    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    // Si la prueba ha terminado, realizar el pago
    const subscription = await stripeClient.subscriptions.retrieve(tienda.subscriptionId);

    if (subscription.status === "trialing") {
      // Cambiar la suscripción a activa
      const updatedSubscription = await stripeClient.subscriptions.update(tienda.subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: 'price_1QRMEpAU7UFoerJEeekcHnjW', // El ID de tu precio para pago
          },
        ],
      });

      tienda.subscription_status = "active";
      await tienda.save();

      res.json({
        message: "Suscripción activada y pago procesado",
        subscription: updatedSubscription,
      });
    } else {
      res.status(400).json({ message: "La suscripción no está en periodo de prueba" });
    }
  } catch (error) {
    console.error("Error al pagar la suscripción:", error);
    res.status(500).json({ message: "Error al pagar la suscripción" });
  }
};




// Ver el estado de suscripción de todas las tiendas
export const getAllSubscriptionStatuses = async (req, res) => {
  try {
    // Obtener todas las tiendas de la base de datos
    const tiendas = await Tienda.find();

    if (!tiendas || tiendas.length === 0) {
      return res.status(404).json({ message: "No se encontraron tiendas" });
    }

    // Crear una lista para almacenar los estados de las suscripciones
    const subscriptionStatuses = [];

    // Iterar sobre las tiendas y obtener el estado de suscripción de cada una
    for (const tienda of tiendas) {
      try {
        if (!tienda.subscriptionId) {
          subscriptionStatuses.push({
            tiendaId: tienda._id,
            nombre: tienda.nombre,
            estado: "Sin suscripción",
          });
          continue;
        }

        const subscription = await stripeClient.subscriptions.retrieve(tienda.subscriptionId);
        subscriptionStatuses.push({
          tiendaId: tienda._id,
          nombre: tienda.nombre,
          estado: subscription.status,
          trial_end: subscription.trial_end,
          current_period_end: subscription.current_period_end,
        });
      } catch (error) {
        // Manejar errores individuales para cada tienda
        console.error(`Error al obtener la suscripción para la tienda ${tienda._id}:`, error.message);
        subscriptionStatuses.push({
          tiendaId: tienda._id,
          nombre: tienda.nombre,
          estado: "Error al obtener suscripción",
        });
      }
    }

    // Enviar los resultados
    res.json(subscriptionStatuses);
  } catch (error) {
    console.error("Error al obtener el estado de las suscripciones:", error);
    res.status(500).json({ message: "Error al obtener el estado de las suscripciones" });
  }
};


// Verificar y activar las suscripciones de todas las tiendas
export const processAllSubscriptions = async (req, res) => {
  try {
    // Obtener todas las tiendas de la base de datos
    const tiendas = await Tienda.find();

    if (!tiendas || tiendas.length === 0) {
      return res.status(404).json({ message: "No se encontraron tiendas" });
    }

    const results = [];

    for (const tienda of tiendas) {
      try {
        if (!tienda.subscriptionId) {
          // Si la tienda no tiene una suscripción, registrar el estado
          results.push({
            tiendaId: tienda._id,
            nombre: tienda.nombre,
            estado: "Sin suscripción",
          });
          continue;
        }

        // Obtener el estado de la suscripción
        const subscription = await stripeClient.subscriptions.retrieve(tienda.subscriptionId);

        if (subscription.status === "trialing") {
          // Procesar el pago si está en periodo de prueba
          const updatedSubscription = await stripeClient.subscriptions.update(tienda.subscriptionId, {
            items: [
              {
                id: subscription.items.data[0].id,
                price: 'price_1QRMEpAU7UFoerJEeekcHnjW', // El ID de tu precio para pago
              },
            ],
          });

          tienda.subscription_status = "active";
          await tienda.save();

          results.push({
            tiendaId: tienda._id,
            nombre: tienda.nombre,
            estado: "Suscripción activada y pago procesado",
            subscription: updatedSubscription,
          });
        } else {
          // Registrar el estado de suscripción actual
          results.push({
            tiendaId: tienda._id,
            nombre: tienda.nombre,
            estado: subscription.status,
          });
        }
      } catch (error) {
        console.error(`Error procesando la suscripción para la tienda ${tienda._id}:`, error.message);
        results.push({
          tiendaId: tienda._id,
          nombre: tienda.nombre,
          estado: "Error al procesar la suscripción",
        });
      }
    }

    // Enviar los resultados
    res.json(results);
  } catch (error) {
    console.error("Error al procesar las suscripciones:", error);
    res.status(500).json({ message: "Error al procesar las suscripciones" });
  }
};


// Pagar la suscripción para una tienda específica
export const paySubscription2 = async (req, res) => {
  try {
    const { tiendaId } = req.params;
    const tienda = await Tienda.findById(tiendaId);

    if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });

    // Obtener información de la suscripción
    const subscription = await stripeClient.subscriptions.retrieve(tienda.subscriptionId);

    if (subscription.status === "trialing") {
      // Cambiar la suscripción a activa
      const updatedSubscription = await stripeClient.subscriptions.update(tienda.subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: 'price_1QRMEpAU7UFoerJEeekcHnjW', // Cambia por el ID de tu precio
          },
        ],
      });

      tienda.subscription_status = "active";
      await tienda.save();

      res.json({
        message: "Suscripción activada y pago procesado",
        subscription: updatedSubscription,
      });
    } else {
      res.status(400).json({ message: "La suscripción no está en periodo de prueba" });
    }
  } catch (error) {
    console.error("Error al pagar la suscripción:", error);
    res.status(500).json({ message: "Error al pagar la suscripción" });
  }
};
