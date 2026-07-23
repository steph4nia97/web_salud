const express = require("express");
const {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  actualizarPerfilUsuario,
  cambiarContraseña,
} = require("../controladores/autenticacionControlador");
const { verificarToken } = require("../middlewares/authMiddleware");

const enrutador = express.Router();

enrutador.post("/registro", registrarUsuario);
enrutador.post("/login", iniciarSesion);
enrutador.get("/perfil", verificarToken, obtenerPerfil);
enrutador.patch("/perfil", verificarToken, actualizarPerfilUsuario);
enrutador.patch("/contrasena", verificarToken, cambiarContraseña);

module.exports = enrutador;
