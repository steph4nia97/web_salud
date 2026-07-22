const express = require("express");
const {
  obtenerConfigDia,
  obtenerMes,
  configurarDia,
  configurarHorario,
  alternarHora,
} = require("../controladores/agendaControlador");
const { verificarToken } = require("../middlewares/authMiddleware");

const enrutador = express.Router();

enrutador.use(verificarToken);

enrutador.get("/dia", obtenerConfigDia);
enrutador.get("/mes", obtenerMes);
enrutador.put("/dia", configurarDia);
enrutador.put("/horario", configurarHorario);
enrutador.put("/hora", alternarHora);

module.exports = enrutador;


