const {
  guardarEstadoDia,
  guardarHorarioDia,
  bloquearHora,
  liberarHora,
  bloquearTodasLasHoras,
  liberarTodasLasHoras,
  obtenerEstadosEntre,
  listarHorariosSemana,
  guardarHorarioSemana,
  obtenerHorarioSemana,
} = require("../modelos/agendaModelo");
const {
  detalleAgendaDia,
  obtenerHorasBaseDelDia,
  HORAS_ATENCION,
} = require("../servicios/disponibilidadServicio");
const {
  esDiaLaborable,
  diaSemanaISO,
  generarHorasPorRango,
} = require("../config/horarios");
const { registrarDesdeReq } = require("../servicios/actividadServicio");

const NOMBRES_DIA = {
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábados",
  7: "domingos",
};

async function mapaAperturaSemanal() {
  const lista = await listarHorariosSemana();
  return Object.fromEntries(lista.map((h) => [h.diaSemana, h.abierto]));
}

function abiertoBaseFecha(fecha, overrides, mapaSemana) {
  if (overrides[fecha] !== undefined) return overrides[fecha];
  const ds = diaSemanaISO(fecha);
  if (mapaSemana[ds] !== undefined) return mapaSemana[ds];
  return esDiaLaborable(fecha);
}

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
    const [overrides, mapaSemana] = await Promise.all([
      obtenerEstadosEntre(desde, hasta),
      mapaAperturaSemanal(),
    ]);

    const dias = [];
    for (let d = 1; d <= ultimoDia; d += 1) {
      const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dias.push({
        fecha,
        abierto: abiertoBaseFecha(fecha, overrides, mapaSemana),
        override: overrides[fecha] !== undefined,
      });
    }

    res.json({ anio, mes, dias });
  } catch (error) {
    console.error("Error en obtenerMes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function listarSemana(req, res) {
  try {
    const horarios = await listarHorariosSemana();
    res.json({ horarios });
  } catch (error) {
    console.error("Error en listarSemana:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function configurarSemana(req, res) {
  try {
    const { dia_semana, abierto, hora_inicio, hora_fin, intervalo } = req.body;
    const diaSemana = Number(dia_semana);

    if (!diaSemana || diaSemana < 1 || diaSemana > 7) {
      return res.status(400).json({
        mensaje: "Debes enviar dia_semana (1=lunes … 7=domingo)",
      });
    }
    if (typeof abierto !== "boolean") {
      return res.status(400).json({ mensaje: "Debes enviar abierto (true/false)" });
    }

    let horaInicio = hora_inicio || null;
    let horaFin = hora_fin || null;
    let paso = Number(intervalo) || null;

    if (abierto) {
      if (!horaInicio || !horaFin || !paso) {
        return res.status(400).json({
          mensaje: "Debes enviar hora_inicio, hora_fin e intervalo",
        });
      }
      const generadas = generarHorasPorRango(horaInicio, horaFin, paso);
      if (!generadas.length) {
        return res.status(400).json({
          mensaje:
            "Rango inválido. Revisa que la hora fin sea mayor y el intervalo (5–180 min).",
        });
      }
    }

    const guardado = await guardarHorarioSemana({
      diaSemana,
      abierto,
      horaInicio,
      horaFin,
      intervalo: paso,
    });

    await registrarDesdeReq(
      req,
      "horario_semana",
      `${NOMBRES_DIA[diaSemana]}: ${abierto ? "abierto" : "cerrado"}${
        abierto ? ` ${horaInicio}–${horaFin} cada ${paso} min` : ""
      }`
    );

    res.json({
      mensaje: abierto
        ? `Horario guardado para todos los ${NOMBRES_DIA[diaSemana]}`
        : `Los ${NOMBRES_DIA[diaSemana]} quedarán cerrados por defecto`,
      horario: guardado,
    });
  } catch (error) {
    console.error("Error en configurarSemana:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function configurarAperturaSemana(req, res) {
  try {
    const { dia_semana, abierto } = req.body;
    const diaSemana = Number(dia_semana);

    if (!diaSemana || diaSemana < 1 || diaSemana > 7) {
      return res.status(400).json({
        mensaje: "Debes enviar dia_semana (1=lunes … 7=domingo)",
      });
    }
    if (typeof abierto !== "boolean") {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar abierto (true/false)" });
    }

    const actual = await obtenerHorarioSemana(diaSemana);
    const guardado = await guardarHorarioSemana({
      diaSemana,
      abierto,
      horaInicio: actual?.horaInicio || "09:00",
      horaFin: actual?.horaFin || "18:00",
      intervalo: actual?.intervalo || 30,
    });

    await registrarDesdeReq(
      req,
      abierto ? "semana_abierta" : "semana_cerrada",
      `Todos los ${NOMBRES_DIA[diaSemana]} quedaron ${abierto ? "abiertos" : "cerrados"} por defecto`
    );

    res.json({
      mensaje: abierto
        ? `Todos los ${NOMBRES_DIA[diaSemana]} quedaron abiertos en el calendario`
        : `Todos los ${NOMBRES_DIA[diaSemana]} quedaron cerrados en el calendario`,
      horario: guardado,
    });
  } catch (error) {
    console.error("Error en configurarAperturaSemana:", error);
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
    await registrarDesdeReq(
      req,
      abierto ? "dia_abierto" : "dia_cerrado",
      abierto
        ? `Se abrió el día ${fecha} para agendar`
        : `Se cerró el día ${fecha}`
    );
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
    await registrarDesdeReq(
      req,
      "horario_aplicado",
      `${fecha}: ${hora_inicio}–${hora_fin}, cada ${paso} min (${generadas.length} cupos)`
    );
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
    await registrarDesdeReq(
      req,
      bloqueada ? "hora_bloqueada" : "hora_liberada",
      `${fecha} ${hora}: ${bloqueada ? "bloqueada" : "liberada"}`
    );
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
  listarSemana,
  configurarSemana,
  configurarAperturaSemana,
  configurarDia,
  configurarHorario,
  alternarHora,
};
