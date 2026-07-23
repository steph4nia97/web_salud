const express = require("express");
const {
  listarHistorial,
  exportarHistorialExcel,
} = require("../controladores/historialControlador");
const { verificarToken } = require("../middlewares/authMiddleware");

const enrutador = express.Router();

enrutador.get("/", verificarToken, listarHistorial);
enrutador.get("/exportar", verificarToken, exportarHistorialExcel);

module.exports = enrutador;
