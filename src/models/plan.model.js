import mongoose from "mongoose";

const TiendaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  propietarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo de usuario
    required: true,
  },
  logo: {
    type: String,
    required: false,
  },
  telefono: {
    type: String,
    required: false,
  },
  direccion: {
    type: String,
    required: false,
  },
  stripeCustomerId: {
    type: String,
    required: true,
  },
  stripeAccountId: {
    type: String,
    required: true,
  },
  paymentLink: {
    type: String,
    required: true,
  },
  onboardingLink: {
    type: String,
    required: true,
  },
  subscription_status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending',
  },
  subscriptionId: {
    type: String,
    required: false,
  },
  subscriptionExpirationDate: {
    type: Date,
    required: false, // Almacenará la fecha de vencimiento de la suscripción
  },
  subscriptionDaysRemaining: {
    type: Number,
    required: false, // Almacenará los días restantes de la suscripción
  },
}, {
  timestamps: true, // Añade createdAt y updatedAt automáticamente
});

export const Tienda = mongoose.model("Tienda", TiendaSchema);