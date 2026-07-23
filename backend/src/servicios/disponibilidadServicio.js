const {
  obtenerHorasOcupadas,
  obtenerCitasActivasPorFecha,
} = require("../modelos/citaModelo");
const {
  obtenerEstadoDia,
  obtenerFilaDia,
  obtenerHorasBloqueadas,
  obtenerHorarioSemana,
} = require("../modelos/agendaModelo");
const {
  HORAS_ATENCION,
  esDiaLaborable,
  diaSemanaISO,
  esFechaPasada,
  generarHorasPorRango,
} = require("../config/horarios");

async function plantillaSemana(fecha) {
  return obtenerHorarioSemana(diaSemanaISO(fecha));
}

async function diaEstaAbierto(fecha) {
  const override = await obtenerEstadoDia(fecha);
  if (override !== null) return override;

  const semana = await plantillaSemana(fecha);
  if (semana) return semana.abierto;

  return esDiaLaborable(fecha);
}

async function obtenerHorasBaseDelDia(fecha) {
  const fila = await obtenerFilaDia(fecha);
  if (fila?.hora_inicio && fila?.hora_fin && fila?.intervalo) {
    const generadas = generarHorasPorRango(
      fila.hora_inicio,
      fila.hora_fin,
      fila.intervalo
    );
    if (generadas.length) {
      return {
        horas: generadas,
        horario: {
          horaInicio: fila.hora_inicio,
          horaFin: fila.hora_fin,
          intervalo: fila.intervalo,
        },
        fuente: "fecha",
      };
    }
  }

  const semana = await plantillaSemana(fecha);
  if (semana?.horaInicio && semana?.horaFin && semana?.intervalo) {
    const generadas = generarHorasPorRango(
      semana.horaInicio,
      semana.horaFin,
      semana.intervalo
    );
    if (generadas.length) {
      return {
        horas: generadas,
        horario: {
          horaInicio: semana.horaInicio,
          horaFin: semana.horaFin,
          intervalo: semana.intervalo,
        },
        fuente: "semana",
      };
    }
  }

  return { horas: [...HORAS_ATENCION], horario: null, fuente: "default" };
}

async function calcularDisponibilidad(fecha) {
  if (esFechaPasada(fecha)) {
    return {
      fecha,
      abierto: false,
      horasDisponibles: [],
      mensaje: "Fecha pasada",
    };
  }

  const abierto = await diaEstaAbierto(fecha);
  if (!abierto) {
    return {
      fecha,
      abierto: false,
      horasDisponibles: [],
      mensaje: "Este día no está disponible para agendar",
    };
  }

  const [{ horas }, ocupadas, bloqueadas] = await Promise.all([
    obtenerHorasBaseDelDia(fecha),
    obtenerHorasOcupadas(fecha),
    obtenerHorasBloqueadas(fecha),
  ]);

  const horasDisponibles = horas.filter(
    (hora) => !ocupadas.includes(hora) && !bloqueadas.includes(hora)
  );

  return {
    fecha,
    abierto: true,
    horasDisponibles,
    mensaje: horasDisponibles.length
      ? null
      : "No hay horarios libres este día",
  };
}

async function detalleAgendaDia(fecha) {
  const abiertoPorDefecto = esDiaLaborable(fecha);
  const override = await obtenerEstadoDia(fecha);
  const semana = await plantillaSemana(fecha);
  const abierto =
    override !== null
      ? override
      : semana
        ? semana.abierto
        : abiertoPorDefecto;

  const [{ horas: horasBase, horario, fuente }, citasActivas, bloqueadas] =
    await Promise.all([
      obtenerHorasBaseDelDia(fecha),
      obtenerCitasActivasPorFecha(fecha),
      obtenerHorasBloqueadas(fecha),
    ]);

  const citasPorHora = Object.fromEntries(
    citasActivas.map((c) => [c.hora, c])
  );

  const horas = horasBase.map((hora) => {
    const cita = citasPorHora[hora];
    if (cita) {
      return {
        hora,
        estado: "ocupada",
        citaId: cita.id,
        paciente: cita.nombre_paciente,
        estadoCita: cita.estado,
      };
    }
    if (bloqueadas.includes(hora)) {
      return { hora, estado: "bloqueada" };
    }
    return { hora, estado: "libre" };
  });

  return {
    fecha,
    abierto,
    override: override !== null,
    abiertoPorDefecto,
    horario,
    horarioFuente: fuente,
    horarioSemana: semana,
    diaSemana: diaSemanaISO(fecha),
    horas,
  };
}

module.exports = {
  diaEstaAbierto,
  calcularDisponibilidad,
  detalleAgendaDia,
  obtenerHorasBaseDelDia,
  plantillaSemana,
  HORAS_ATENCION,
};
