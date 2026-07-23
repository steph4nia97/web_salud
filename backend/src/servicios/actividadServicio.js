const { registrarActividad } = require("../modelos/actividadModelo");

async function registrarDesdeReq(req, accion, detalle) {
  try {
    const usuario = req.usuario;
    await registrarActividad({
      usuarioId: usuario?.id ?? null,
      usuarioNombre: usuario?.nombre ?? "Sistema",
      accion,
      detalle,
    });
  } catch (error) {
    console.error("No se pudo registrar actividad:", error.message);
  }
}

async function registrarPublica(accion, detalle) {
  try {
    await registrarActividad({
      usuarioId: null,
      usuarioNombre: "Paciente / público",
      accion,
      detalle,
    });
  } catch (error) {
    console.error("No se pudo registrar actividad:", error.message);
  }
}

module.exports = {
  registrarDesdeReq,
  registrarPublica,
};
