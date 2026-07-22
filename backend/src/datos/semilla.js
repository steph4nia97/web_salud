require("dotenv").config();
const bcrypt = require("bcryptjs");
require("../config/basedatos");
const {
  crearUsuario,
  buscarUsuarioPorCorreo,
} = require("../modelos/usuarioModelo");

async function sembrar() {
  const correo = "medico@consulta.local";
  const existente = await buscarUsuarioPorCorreo(correo);

  if (existente) {
    console.log("Usuario médico ya existe:", correo);
    process.exit(0);
  }

  const contraseñaHash = await bcrypt.hash("medico123", 10);
  const usuario = await crearUsuario({
    nombre: "Dr. Fabiar Arce Tamblay",
    correo,
    contraseñaHash,
    rol: "medico",
  });

  console.log("Usuario médico creado:");
  console.log("  correo:", correo);
  console.log("  contraseña: medico123");
  console.log("  id:", usuario.id);
  process.exit(0);
}

sembrar().catch((error) => {
  console.error(error);
  process.exit(1);
});
