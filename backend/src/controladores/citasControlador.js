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
const { esFechaPasada, esDiaLaborable, diaSemanaISO } = require("../config/horarios");
const {
  obtenerHorasBloqueadas,
  obtenerEstadosEntre,
  listarHorariosSemana,
} = require("../modelos/agendaModelo");
const {
  textoConfirmacion,
  textoCancelacion,
  enviarCorreoCita,
} = require("../servicios/correoServicio");
const {
  registrarDesdeReq,
  registrarPublica,
} = require("../servicios/actividadServicio");


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

async function consultarCalendarioMes(req, res) {
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
    const [overrides, listaSemana] = await Promise.all([
      obtenerEstadosEntre(desde, hasta),
      listarHorariosSemana(),
    ]);
    const mapaSemana = Object.fromEntries(
      listaSemana.map((h) => [h.diaSemana, h.abierto])
    );

    const dias = [];
    for (let d = 1; d <= ultimoDia; d += 1) {
      const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const pasado = esFechaPasada(fecha);
      let abiertoBase;
      if (overrides[fecha] !== undefined) {
        abiertoBase = overrides[fecha];
      } else {
        const ds = diaSemanaISO(fecha);
        abiertoBase =
          mapaSemana[ds] !== undefined
            ? mapaSemana[ds]
            : esDiaLaborable(fecha);
      }
      const abierto = !pasado && abiertoBase;
      dias.push({
        fecha,
        abierto,
        pasado,
        disponible: abierto,
      });
    }

    res.json({ anio, mes, dias });
  } catch (error) {
    console.error("Error en consultarCalendarioMes:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

function validarDatosPaciente({ nombre_paciente, correo, telefono }) {
  const nombre = String(nombre_paciente || "").trim();
  const correoTrim = String(correo || "").trim().toLowerCase();
  const telefonoTrim = String(telefono || "").trim();

  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(nombre)) {
    return "El nombre solo puede contener letras y espacios";
  }
  if (nombre.length < 8 || nombre.length > 40) {
    return "El nombre debe tener entre 8 y 40 letras";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoTrim)) {
    return "El correo no tiene un formato válido";
  }

  if (!/^\+569\d{8}$/.test(telefonoTrim)) {
    return "El teléfono debe ser +569 seguido de 8 dígitos";
  }

  return null;
}

async function agendarCita(req, res) {
  try {
    const { nombre_paciente, correo, telefono, fecha, hora, motivo } =
      req.body;

    if (!nombre_paciente || !correo || !telefono || !fecha || !hora) {
      return res.status(400).json({ mensaje: "Faltan datos de la cita" });
    }

    const errorDatos = validarDatosPaciente({
      nombre_paciente,
      correo,
      telefono,
    });
    if (errorDatos) {
      return res.status(400).json({ mensaje: errorDatos });
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

    const nombreLimpio = String(nombre_paciente).trim();
    const correoLimpio = String(correo).trim().toLowerCase();
    const telefonoLimpio = String(telefono).trim();

    const nuevaCita = await crearCita({
      nombrePaciente: nombreLimpio,
      correo: correoLimpio,
      telefono: telefonoLimpio,
      fecha,
      hora,
      motivo,
    });

    await registrarPublica(
      "cita_agendada",
      `${nombreLimpio} agendó cita el ${fecha} a las ${hora}`
    );

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

    if (estado === "confirmada" || estado === "cancelada") {
      const accion =
        estado === "confirmada" ? "cita_confirmada" : "cita_cancelada";
      await registrarDesdeReq(
        req,
        accion,
        `${actualizada.nombre_paciente} · ${actualizada.fecha} ${actualizada.hora} → ${estado}`
      );
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

    await registrarDesdeReq(
      req,
      "correo_enviado",
      `Correo de ${tipo} a ${cita.correo} (${cita.nombre_paciente}, ${cita.fecha} ${cita.hora})`
    );

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
  consultarCalendarioMes,
  agendarCita,
  listarCitas,
  cambiarEstadoCita,
  obtenerBorradorCorreo,
  enviarCorreo,
};
