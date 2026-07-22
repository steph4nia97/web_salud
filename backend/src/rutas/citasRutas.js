const express = require("express");
const {
  consultarDisponibilidad,
  agendarCita,
  listarCitas,
  cambiarEstadoCita,
} = require("../controladores/citasControlador");
const { verificarToken } = require("../middlewares/authMiddleware");

const enrutador = express.Router();

// Público: pacientes agendan desde la web
enrutador.get("/disponibilidad", consultarDisponibilidad);
enrutador.post("/", agendarCita);

// Privado: panel del médico/admin
enrutador.get("/", verificarToken, listarCitas);
enrutador.patch("/:id/estado", verificarToken, cambiarEstadoCita);

module.exports = enrutador;
