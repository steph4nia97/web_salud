const bd = require("../config/basedatos");

function crearUsuario({ nombre, correo, contraseñaHash, rol }) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      INSERT INTO usuarios (nombre, correo, contraseña_hash, rol)
      VALUES (?, ?, ?, ?)
    `;
    bd.run(sql, [nombre, correo, contraseñaHash, rol], function (error) {
      if (error) return rechazar(error);
      resolver({
        id: this.lastID,
        nombre,
        correo,
        rol,
      });
    });
  });
}

function buscarUsuarioPorCorreo(correo) {
  return new Promise((resolver, rechazar) => {
    const sql = `SELECT * FROM usuarios WHERE correo = ?`;
    bd.get(sql, [correo], (error, fila) => {
      if (error) return rechazar(error);
      resolver(fila || null);
    });
  });
}

function buscarUsuarioPorId(id) {
  return new Promise((resolver, rechazar) => {
    const sql = `SELECT id, nombre, correo, rol FROM usuarios WHERE id = ?`;
    bd.get(sql, [id], (error, fila) => {
      if (error) return rechazar(error);
      resolver(fila || null);
    });
  });
}

module.exports = {
  crearUsuario,
  buscarUsuarioPorCorreo,
  buscarUsuarioPorId,
};
