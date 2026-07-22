const express = require("express");
const {
  registrarUsuario,
  iniciarSesion,
} = require("../controladores/autenticacionControlador");

const enrutador = express.Router();

enrutador.post("/registro", registrarUsuario);
enrutador.post("/login", iniciarSesion);

module.exports = enrutador;
