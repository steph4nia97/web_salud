/** Horarios de atención disponibles (lun–vie). */
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

module.exports = {
  HORAS_ATENCION,
  esDiaLaborable,
  esFechaPasada,
};
