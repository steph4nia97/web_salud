const nodemailer = require("nodemailer");

function formatearFechaEs(fechaISO) {
  const [y, m, d] = fechaISO.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function textoConfirmacion(cita) {
  const dia = formatearFechaEs(cita.fecha);
  return (
    `Estimado/a ${cita.nombre_paciente},\n\n` +
    `Le confirmamos su cita con el Dr. Fabiar Arce Tamblay (Traumatología y Ortopedia).\n\n` +
    `Fecha: ${dia}\n` +
    `Hora: ${cita.hora}\n\n` +
    `Por favor llegue con algunos minutos de anticipación. Si necesita reprogramar, contáctenos a la brevedad.\n\n` +
    `Saludos cordiales,\n` +
    `Consultorio Dr. Fabiar Arce Tamblay`
  );
}

function textoCancelacion(cita) {
  const dia = formatearFechaEs(cita.fecha);
  return (
    `Estimado/a ${cita.nombre_paciente},\n\n` +
    `Lamentamos informarle que su cita con el Dr. Fabiar Arce Tamblay ha sido cancelada.\n\n` +
    `Fecha original: ${dia}\n` +
    `Hora original: ${cita.hora}\n\n` +
    `Si desea reagendar, puede hacerlo a través de nuestra página web o contactándonos directamente.\n\n` +
    `Saludos cordiales,\n` +
    `Consultorio Dr. Fabiar Arce Tamblay`
  );
}

function asuntoPorTipo(tipo) {
  if (tipo === "confirmacion") {
    return "Confirmación de cita — Dr. Fabiar Arce Tamblay";
  }
  return "Cancelación de cita — Dr. Fabiar Arce Tamblay";
}

function crearTransportador() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function enviarCorreoCita({ cita, tipo, mensaje }) {
  const texto = (mensaje && mensaje.trim()) || (
    tipo === "confirmacion" ? textoConfirmacion(cita) : textoCancelacion(cita)
  );
  const asunto = asuntoPorTipo(tipo);
  const remitente =
    process.env.CORREO_REMITENTE ||
    process.env.SMTP_USER ||
    "noreply@consulta.local";

  const modo = (process.env.CORREO_MODO || "smtp").toLowerCase();
  const transportador = crearTransportador();

  // Sin SMTP: simula el envío (útil en desarrollo)
  if (modo === "simulacion" || !transportador) {
    console.log("------ Correo simulado ------");
    console.log("Para:", cita.correo);
    console.log("Asunto:", asunto);
    console.log(texto);
    console.log("-----------------------------");
    return {
      simulado: true,
      para: cita.correo,
      asunto,
      mensaje: texto,
    };
  }

  await transportador.sendMail({
    from: `"Dr. Fabiar Arce Tamblay" <${remitente}>`,
    to: cita.correo,
    subject: asunto,
    text: texto,
  });

  return {
    simulado: false,
    para: cita.correo,
    asunto,
    mensaje: texto,
  };
}

module.exports = {
  textoConfirmacion,
  textoCancelacion,
  enviarCorreoCita,
};
