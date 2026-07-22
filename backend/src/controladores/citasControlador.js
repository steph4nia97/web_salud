const {
  crearCita,
  obtenerCitasPorFecha,
  obtenerHorasOcupadas,
  obtenerTodasLasCitas,
  actualizarEstadoCita,
} = require("../modelos/citaModelo");
const {
  HORAS_ATENCION,
  esDiaLaborable,
  esFechaPasada,
} = require("../config/horarios");

async function consultarDisponibilidad(req, res) {
  try {
    const { fecha } = req.query;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar una fecha (YYYY-MM-DD)" });
    }

    if (esFechaPasada(fecha)) {
      return res.json({ fecha, horasDisponibles: [], mensaje: "Fecha pasada" });
    }

    if (!esDiaLaborable(fecha)) {
      return res.json({
        fecha,
        horasDisponibles: [],
        mensaje: "No hay atención los fines de semana",
      });
    }

    const ocupadas = await obtenerHorasOcupadas(fecha);
    const horasDisponibles = HORAS_ATENCION.filter(
      (hora) => !ocupadas.includes(hora)
    );

    res.json({ fecha, horasDisponibles });
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

    if (esFechaPasada(fecha) || !esDiaLaborable(fecha)) {
      return res
        .status(400)
        .json({ mensaje: "La fecha seleccionada no está disponible" });
    }

    if (!HORAS_ATENCION.includes(hora)) {
      return res.status(400).json({ mensaje: "Horario no válido" });
    }

    const ocupadas = await obtenerHorasOcupadas(fecha);
    if (ocupadas.includes(hora)) {
      return res
        .status(409)
        .json({ mensaje: "Ese horario ya está reservado" });
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

module.exports = {
  consultarDisponibilidad,
  agendarCita,
  listarCitas,
  cambiarEstadoCita,
};
