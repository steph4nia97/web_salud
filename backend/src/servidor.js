require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./config/basedatos");

const rutasAutenticacion = require("./rutas/autenticacionRutas");
const rutasCitas = require("./rutas/citasRutas");
const rutasAgenda = require("./rutas/agendaRutas");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensaje: "Backend agenda médica funcionando" });
});

app.use("/api/auth", rutasAutenticacion);
app.use("/api/citas", rutasCitas);
app.use("/api/agenda", rutasAgenda);

const PUERTO = process.env.PUERTO || 4000;

app.listen(PUERTO, () => {
  console.log("Servidor escuchando en el puerto", PUERTO);
});
