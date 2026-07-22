const {
  guardarEstadoDia,
  guardarHorarioDia,
  bloquearHora,
  liberarHora,
  bloquearTodasLasHoras,
  liberarTodasLasHoras,
  obtenerEstadosEntre,
} = require("../modelos/agendaModelo");
const {
  detalleAgendaDia,
  obtenerHorasBaseDelDia,
  HORAS_ATENCION,
} = require("../servicios/disponibilidadServicio");
const {
  esDiaLaborable,
  generarHorasPorRango,
} = require("../config/horarios");

async function obtenerConfigDia(req, res) {
  try {
    const { fecha } = req.query;
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar una fecha (YYYY-MM-DD)" });
    }

    const detalle = await detalleAgendaDia(fecha);
    res.json(detalle);
  } catch (error) {
    console.error("Error en obtenerConfigDia:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function obtenerMes(req, res) {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!anio || !mes || mes < 1 || mes > 12) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar anio y mes (1-12)" });
    }

    const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
    const ultimoDia = new Date(anio, mes, 0).getDate();
    const hasta = `${anio}-${String(mes).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
    const overrides = await obtenerEstadosEntre(desde, hasta);

    const dias = [];
    for (let d = 1; d <= ultimoDia; d += 1) {
      const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const abierto =
        overrides[fecha] !== undefined
          ? overrides[fecha]
          : esDiaLaborable(fecha);
      dias.push({
        fecha,
        abierto,
        override: overrides[fecha] !== undefined,
      });
    }

    res.json({ anio, mes, dias });
  } catch (error) {
    console.error("Error en obtenerMes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function configurarDia(req, res) {
  try {
    const { fecha, abierto } = req.body;
    if (!fecha || typeof abierto !== "boolean") {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar fecha y abierto (true/false)" });
    }

    await guardarEstadoDia(fecha, abierto);
    const { horas } = await obtenerHorasBaseDelDia(fecha);

    if (!abierto) {
      await bloquearTodasLasHoras(fecha, horas.length ? horas : HORAS_ATENCION);
    } else {
      await liberarTodasLasHoras(fecha);
    }

    const detalle = await detalleAgendaDia(fecha);
    res.json({
      mensaje: abierto ? "Día abierto para agendar" : "Día cerrado",
      ...detalle,
    });
  } catch (error) {
    console.error("Error en configurarDia:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function configurarHorario(req, res) {
  try {
    const { fecha, hora_inicio, hora_fin, intervalo } = req.body;
    const paso = Number(intervalo);

    if (!fecha || !hora_inicio || !hora_fin || !paso) {
      return res.status(400).json({
        mensaje: "Debes enviar fecha, hora_inicio, hora_fin e intervalo",
      });
    }

    const generadas = generarHorasPorRango(hora_inicio, hora_fin, paso);
    if (!generadas.length) {
      return res.status(400).json({
        mensaje:
          "Rango inválido. Revisa que la hora fin sea mayor y el intervalo (5–180 min).",
      });
    }

    await guardarHorarioDia(fecha, {
      abierto: true,
      horaInicio: hora_inicio,
      horaFin: hora_fin,
      intervalo: paso,
    });
    await liberarTodasLasHoras(fecha);

    const detalle = await detalleAgendaDia(fecha);
    res.json({
      mensaje: `Horarios aplicados: ${generadas.length} cupos cada ${paso} min`,
      ...detalle,
    });
  } catch (error) {
    console.error("Error en configurarHorario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function alternarHora(req, res) {
  try {
    const { fecha, hora, bloqueada } = req.body;

    if (!fecha || !hora || typeof bloqueada !== "boolean") {
      return res.status(400).json({
        mensaje: "Debes enviar fecha, hora y bloqueada (true/false)",
      });
    }

    const { horas: horasValidas } = await obtenerHorasBaseDelDia(fecha);
    if (!horasValidas.includes(hora)) {
      return res.status(400).json({ mensaje: "Horario no válido para este día" });
    }

    const detalleActual = await detalleAgendaDia(fecha);
    const slot = detalleActual.horas.find((h) => h.hora === hora);
    if (slot?.estado === "ocupada") {
      return res.status(409).json({
        mensaje: "No puedes bloquear/liberar una hora ya agendada",
      });
    }

    if (!detalleActual.abierto && !bloqueada) {
      await guardarEstadoDia(fecha, true);
      await liberarTodasLasHoras(fecha);
    }

    if (bloqueada) {
      await bloquearHora(fecha, hora);
    } else {
      await liberarHora(fecha, hora);
    }

    const detalle = await detalleAgendaDia(fecha);
    res.json({
      mensaje: bloqueada ? "Hora bloqueada" : "Hora liberada",
      ...detalle,
    });
  } catch (error) {
    console.error("Error en alternarHora:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  obtenerConfigDia,
  obtenerMes,
  configurarDia,
  configurarHorario,
  alternarHora,
};
