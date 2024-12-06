import { Router } from "express";
import {
  login,
  logout,
  register,
  verifyToken,
  getAllUsers
} from "../controllers/auth.controller.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { loginSchema, registerSchema, loginTiendaSchema, registerTiendaSchema} from "../schemas/auth.schema.js"
import { registerTienda,loginTienda,verifyTiendaToken,  } from "../controllers/vendores.controller.js";

import {loginSuperAdmin, logoutSuperAdmin} from "../controllers/superauth.controllers.js";

const router = Router();



router.post("/register", validateSchema(registerSchema), register);
router.post("/login", validateSchema(loginSchema), login);
router.get("/verify", verifyToken);
router.post("/logout",logout);
router.post("/register-tienda",validateSchema(registerTiendaSchema) ,registerTienda);
router.post("/login-tienda", validateSchema(loginTiendaSchema),loginTienda);
router.get("/verify-tienda", verifyTiendaToken);

// Ruta para login de super administrador
router.post('/login-superadmin', loginSuperAdmin);

// Ruta para logout de super administrador
router.post('/logout-superadmin', logoutSuperAdmin);


router.get("/users", getAllUsers);

export default router;
