const express = require("express");
const {
  obtenerConfigDia,
  obtenerMes,
  listarSemana,
  configurarSemana,
  configurarAperturaSemana,
  configurarDia,
  configurarHorario,
  alternarHora,
} = require("../controladores/agendaControlador");
const { verificarToken } = require("../middlewares/authMiddleware");

const enrutador = express.Router();

enrutador.use(verificarToken);

enrutador.get("/dia", obtenerConfigDia);
enrutador.get("/mes", obtenerMes);
enrutador.get("/semana", listarSemana);
enrutador.put("/semana", configurarSemana);
enrutador.put("/semana/apertura", configurarAperturaSemana);
enrutador.put("/dia", configurarDia);
enrutador.put("/horario", configurarHorario);
enrutador.put("/hora", alternarHora);

module.exports = enrutador;
