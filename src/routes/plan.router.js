import express from "express";
import {
  asignarPlan,
  verificarPlan,
  actualizarPlan,
  obtenerPlan,
  insertarPlan,
  registerTienda, getSubscriptionStatus, cancelSubscription, paySubscription,
  getAllSubscriptionStatuses,
  processAllSubscriptions,
  paySubscription2

} from "../controllers/plan.controller.js";

const router = express.Router();

// Asignar un plan a una tienda
router.post("/:id/plan", asignarPlan);

// Verificar el estado del plan de una tienda
router.get("/:id/plan", verificarPlan);

// Actualizar el plan de una tienda
router.put("/:id/plan", actualizarPlan);

// Obtener detalles del plan de una tienda
router.get("/:id/plan/detalles", obtenerPlan);

router.post("/:id/plan", insertarPlan);

router.post("/plan/register-tienda", registerTienda);


// Ruta para obtener el estado de la suscripción de una tienda
router.get('/subscription-status/:tiendaId', getSubscriptionStatus);

// Ruta para cancelar la suscripción de una tienda
router.delete('/cancel-subscription/:tiendaId', cancelSubscription);

// Ruta para pagar la suscripción después de la prueba gratuita
router.put('/pay-subscription/:tiendaId', paySubscription);


router.get("/pay-subscription", getAllSubscriptionStatuses);

router.get("/subscriptions/process-all", processAllSubscriptions);

router.post('/pay-subscription/:tiendaId', paySubscription2);

export default router;
