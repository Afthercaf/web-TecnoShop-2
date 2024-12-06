import express from 'express';
import Stripe from 'stripe';
import { Compra } from "../models/Pedidos.model.js";
import { Producto } from '../models/productos.model.js';
import { Tienda } from '../models/venderos.model.js';
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

const router = express.Router();


router.get('/tiendas/:id', async (req, res) => {
    try {
      const { id } = req.params; // ID de la tienda desde los parámetros de la URL
  
      // Obtener la información de la tienda
      const tienda = await Tienda.findById(id);
      if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });
  
      // Obtener los productos asociados a la tienda
      const productos = await Producto.find({ tiendaId: id });
  
      res.json({
        tienda,
        productos,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener la información de la tienda" });
    }
  });
  
  // Actualizar estado de la tienda
  router.put('/sup/tiendas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;
  
      // Validar estado
      const estadosPermitidos = ['pending', 'active', 'inactive'];
      if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({ message: "Estado no válido" });
      }
  
      // Actualizar la tienda
      const tienda = await Tienda.findByIdAndUpdate(
        id,
        { subscription_status: estado },
        { new: true }
      );
  
      if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });
  
      // Calcular días restantes de suscripción
      const ahora = new Date();
      const expiracion = tienda.subscriptionExpirationDate;
      const diasRestantes = expiracion
        ? Math.ceil((new Date(expiracion) - ahora) / (1000 * 60 * 60 * 24))
        : null;
  
      res.json({
        tienda,
        diasRestantes: diasRestantes || "Sin suscripción activa",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al actualizar el estado de la tienda" });
    }
  });
  
  // Eliminar una tienda y sus productos
router.delete('/sup/tiendas/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Buscar y eliminar la tienda
      const tienda = await Tienda.findByIdAndDelete(id);
      if (!tienda) return res.status(404).json({ message: "Tienda no encontrada" });
  
      // Eliminar productos asociados a la tienda
      await Producto.deleteMany({ tiendaId: id });
  
      res.json({ message: "Tienda y sus productos eliminados correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al eliminar la tienda" });
    }
  });



  router.get('/tiendasprodcutos', async (req, res) => {
    try {
      // Obtener todas las tiendas
      const tiendas = await Tienda.find();
  
      // Obtener los productos de cada tienda
      const tiendasConProductos = await Promise.all(
        tiendas.map(async (tienda) => {
          const productos = await Producto.find({ tiendaId: tienda._id });
          return {
            tienda,
            productos,
          };
        })
      );
  
      res.json(tiendasConProductos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener las tiendas y productos" });
    }
  });
  
  
export default router;