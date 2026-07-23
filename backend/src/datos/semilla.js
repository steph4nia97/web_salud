require("dotenv").config();
const bcrypt = require("bcryptjs");
require("../config/basedatos");
const {
  crearUsuario,
  buscarUsuarioPorCorreo,
  actualizarNombre,
} = require("../modelos/usuarioModelo");
const bd = require("../config/basedatos");

const NOMBRE_MEDICO = "Dr. Fabian Arce";
const CORREO = "medico@consulta.local";

function actualizarNombreEnLogs(nombreAnterior, nombreNuevo) {
  return new Promise((resolver, rechazar) => {
    bd.run(
      `UPDATE actividad_log SET usuario_nombre = ? WHERE usuario_nombre = ?`,
      [nombreNuevo, nombreAnterior],
      function (error) {
        if (error) return rechazar(error);
        resolver(this.changes);
      }
    );
  });
}

async function sembrar() {
  const existente = await buscarUsuarioPorCorreo(CORREO);

  if (existente) {
    const anterior = existente.nombre;
    if (anterior !== NOMBRE_MEDICO) {
      await actualizarNombre(existente.id, NOMBRE_MEDICO);
      const logs = await actualizarNombreEnLogs(anterior, NOMBRE_MEDICO);
      console.log(`Nombre actualizado: "${anterior}" → "${NOMBRE_MEDICO}"`);
      console.log(`Logs de actividad actualizados: ${logs}`);
    } else {
      console.log("Usuario médico ya está al día:", CORREO, NOMBRE_MEDICO);
    }
    process.exit(0);
  }

  const contraseñaHash = await bcrypt.hash("medico123", 10);
  const usuario = await crearUsuario({
    nombre: NOMBRE_MEDICO,
    correo: CORREO,
    contraseñaHash,
    rol: "medico",
  });

  console.log("Usuario médico creado:");
  console.log("  correo:", CORREO);
  console.log("  contraseña: medico123");
  console.log("  nombre:", NOMBRE_MEDICO);
  console.log("  id:", usuario.id);
  process.exit(0);
}

sembrar().catch((error) => {
  console.error(error);
  process.exit(1);
});
