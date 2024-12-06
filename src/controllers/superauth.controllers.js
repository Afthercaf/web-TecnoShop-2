import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";  // Asegúrate de que el modelo User esté configurado correctamente
import { TOKEN_SECRET } from "../config.js";  // Asegúrate de tener un TOKEN_SECRET en tu archivo de configuración
import cookieParser from "cookie-parser";


// Login para Super Admin
export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por correo y verificar si es super admin
    const userFound = await User.findOne({ email });
    if (!userFound || userFound.tipo !== "super_admin") {
      return res.status(403).json({
        message: ["Acceso denegado: solo para super administradores."],
      });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, userFound.password);
    if (!isMatch) {
      return res.status(400).json({
        message: ["La contraseña es incorrecta"],
      });
    }

    // Crear un supertoken para el super admin
    const supertoken = jwt.sign(
      {
        id: userFound._id,
        username: userFound.username,
        tipo: userFound.tipo,
      },
      TOKEN_SECRET,  // Usa tu clave secreta definida en la configuración
      { expiresIn: '1h' }  // El token expira en 1 hora, puedes ajustar este tiempo
    );

    // Guardar el supertoken en una cookie
    res.cookie("supertoken", supertoken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // Habilita 'secure' solo en producción
      sameSite: "none",  // Permite cookies de terceros
    });

    // Respuesta exitosa con información del super admin
    res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
      tipo: userFound.tipo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout para Super Admin
export const logoutSuperAdmin = (req, res) => {
  // Eliminar el supertoken de las cookies
  res.cookie("supertoken", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),  // Establece la expiración de la cookie en 1970 (ya no válida)
  });

  return res.sendStatus(200);  // Responde con un código de estado 200 (OK)
};
