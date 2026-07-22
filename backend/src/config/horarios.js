/** Horarios por defecto (lun–vie) si el médico no define un rango. */
const HORAS_ATENCION = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

function esDiaLaborable(fechaISO) {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const diaSemana = fecha.getDay();
  return diaSemana >= 1 && diaSemana <= 5;
}

function esFechaPasada(fechaISO) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return fecha < hoy;
}

function aMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function deMinutos(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Genera slots desde hora_inicio hasta hora_fin (sin incluir el fin),
 * cada `intervalo` minutos.
 * Ej: 09:00–10:00 cada 30 → 09:00, 09:30
 */
function generarHorasPorRango(horaInicio, horaFin, intervalo) {
  const inicio = aMinutos(horaInicio);
  const fin = aMinutos(horaFin);
  const paso = Number(intervalo);

  if (
    Number.isNaN(inicio) ||
    Number.isNaN(fin) ||
    !paso ||
    paso < 5 ||
    paso > 180 ||
    fin <= inicio
  ) {
    return [];
  }

  const horas = [];
  for (let t = inicio; t < fin; t += paso) {
    horas.push(deMinutos(t));
  }
  return horas;
}

module.exports = {
  HORAS_ATENCION,
  esDiaLaborable,
  esFechaPasada,
  generarHorasPorRango,
};
