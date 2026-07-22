const jwt = require("jsonwebtoken");
const { buscarUsuarioPorId } = require("../modelos/usuarioModelo");

const CLAVE_JWT = process.env.CLAVE_JWT;

async function verificarToken(req, res, next) {
  try {
    const cabecera = req.headers.authorization;
    if (!cabecera) {
      return res.status(401).json({ mensaje: "Token no proporcionado" });
    }

    const [tipo, token] = cabecera.split(" ");
    if (tipo !== "Bearer" || !token) {
      return res.status(401).json({ mensaje: "Formato de token inválido" });
    }

    const datos = jwt.verify(token, CLAVE_JWT);
    const usuario = await buscarUsuarioPorId(datos.id);

    if (!usuario) {
      return res.status(401).json({ mensaje: "Usuario no encontrado" });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    console.error("Error en verificarToken:", error);
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

module.exports = { verificarToken };
