const {
  crearCita,
  obtenerCitasPorFecha,
  obtenerTodasLasCitas,
  actualizarEstadoCita,
  obtenerCitaPorId,
  obtenerHorasOcupadas,
} = require("../modelos/citaModelo");
const {
  calcularDisponibilidad,
  diaEstaAbierto,
  obtenerHorasBaseDelDia,
} = require("../servicios/disponibilidadServicio");
const { esFechaPasada } = require("../config/horarios");
const { obtenerHorasBloqueadas } = require("../modelos/agendaModelo");
const {
  textoConfirmacion,
  textoCancelacion,
  enviarCorreoCita,
} = require("../servicios/correoServicio");


async function consultarDisponibilidad(req, res) {
  try {
    const { fecha } = req.query;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar una fecha (YYYY-MM-DD)" });
    }

    const resultado = await calcularDisponibilidad(fecha);
    res.json(resultado);
  } catch (error) {
    console.error("Error en consultarDisponibilidad:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function agendarCita(req, res) {
  try {
    const { nombre_paciente, correo, telefono, fecha, hora, motivo } =
      req.body;

    if (!nombre_paciente || !correo || !telefono || !fecha || !hora) {
      return res.status(400).json({ mensaje: "Faltan datos de la cita" });
    }

    if (esFechaPasada(fecha)) {
      return res
        .status(400)
        .json({ mensaje: "La fecha seleccionada no está disponible" });
    }

    const abierto = await diaEstaAbierto(fecha);
    if (!abierto) {
      return res
        .status(400)
        .json({ mensaje: "Este día no está disponible para agendar" });
    }

    const { horas: horasValidas } = await obtenerHorasBaseDelDia(fecha);
    if (!horasValidas.includes(hora)) {
      return res.status(400).json({ mensaje: "Horario no válido" });
    }

    const [ocupadas, bloqueadas] = await Promise.all([
      obtenerHorasOcupadas(fecha),
      obtenerHorasBloqueadas(fecha),
    ]);

    if (ocupadas.includes(hora)) {
      return res
        .status(409)
        .json({ mensaje: "Ese horario ya está reservado" });
    }

    if (bloqueadas.includes(hora)) {
      return res
        .status(409)
        .json({ mensaje: "Ese horario está bloqueado por el médico" });
    }

    const nuevaCita = await crearCita({
      nombrePaciente: nombre_paciente,
      correo,
      telefono,
      fecha,
      hora,
      motivo,
    });

    res.status(201).json({
      mensaje: "Cita agendada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    if (error && error.code === "SQLITE_CONSTRAINT") {
      return res
        .status(409)
        .json({ mensaje: "Ese horario ya está reservado" });
    }
    console.error("Error en agendarCita:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listarCitas(req, res) {
  try {
    const { fecha } = req.query;
    const lista = fecha
      ? await obtenerCitasPorFecha(fecha)
      : await obtenerTodasLasCitas();
    res.json(lista);
  } catch (error) {
    console.error("Error en listarCitas:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function cambiarEstadoCita(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["pendiente", "confirmada", "cancelada"].includes(estado)) {
      return res.status(400).json({ mensaje: "Estado inválido" });
    }

    const actualizada = await actualizarEstadoCita(Number(id), estado);
    if (!actualizada) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    res.json({ mensaje: "Estado actualizado", cita: actualizada });
  } catch (error) {
    console.error("Error en cambiarEstadoCita:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function obtenerBorradorCorreo(req, res) {
  try {
    const cita = await obtenerCitaPorId(Number(req.params.id));
    if (!cita) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    const { tipo } = req.query;
    if (!["confirmacion", "cancelacion"].includes(tipo)) {
      return res.status(400).json({
        mensaje: "Debes indicar tipo=confirmacion o tipo=cancelacion",
      });
    }

    const mensaje =
      tipo === "confirmacion"
        ? textoConfirmacion(cita)
        : textoCancelacion(cita);

    res.json({
      tipo,
      para: cita.correo,
      mensaje,
      editable: true,
    });
  } catch (error) {
    console.error("Error en obtenerBorradorCorreo:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function enviarCorreo(req, res) {
  try {
    const cita = await obtenerCitaPorId(Number(req.params.id));
    if (!cita) {
      return res.status(404).json({ mensaje: "Cita no encontrada" });
    }

    const { tipo, mensaje } = req.body;
    if (!["confirmacion", "cancelacion"].includes(tipo)) {
      return res.status(400).json({
        mensaje: "Debes indicar tipo confirmacion o cancelacion",
      });
    }

    const resultado = await enviarCorreoCita({
      cita,
      tipo,
      mensaje,
    });

    res.json({
      mensaje: resultado.simulado
        ? "Correo simulado (revisa la consola del servidor). Configura SMTP para envío real."
        : "Correo enviado correctamente",
      ...resultado,
    });
  } catch (error) {
    console.error("Error en enviarCorreo:", error);
    res.status(500).json({
      mensaje: error.message || "No se pudo enviar el correo",
    });
  }
}

module.exports = {
  consultarDisponibilidad,
  agendarCita,
  listarCitas,
  cambiarEstadoCita,
  obtenerBorradorCorreo,
  enviarCorreo,
};
