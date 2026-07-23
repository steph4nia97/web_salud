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

function buscarUsuarioAuthPorId(id) {
  return new Promise((resolver, rechazar) => {
    const sql = `SELECT * FROM usuarios WHERE id = ?`;
    bd.get(sql, [id], (error, fila) => {
      if (error) return rechazar(error);
      resolver(fila || null);
    });
  });
}

function actualizarContraseña(id, contraseñaHash) {
  return new Promise((resolver, rechazar) => {
    const sql = `UPDATE usuarios SET contraseña_hash = ? WHERE id = ?`;
    bd.run(sql, [contraseñaHash, id], function (error) {
      if (error) return rechazar(error);
      resolver(this.changes > 0);
    });
  });
}

function actualizarNombre(id, nombre) {
  return new Promise((resolver, rechazar) => {
    const sql = `UPDATE usuarios SET nombre = ? WHERE id = ?`;
    bd.run(sql, [nombre, id], function (error) {
      if (error) return rechazar(error);
      resolver(this.changes > 0);
    });
  });
}

function actualizarPerfil(id, { nombre, correo, contraseñaHash }) {
  return new Promise((resolver, rechazar) => {
    const campos = [];
    const params = [];

    if (nombre !== undefined) {
      campos.push("nombre = ?");
      params.push(nombre);
    }
    if (correo !== undefined) {
      campos.push("correo = ?");
      params.push(correo);
    }
    if (contraseñaHash !== undefined) {
      campos.push("contraseña_hash = ?");
      params.push(contraseñaHash);
    }

    if (!campos.length) {
      return resolver(false);
    }

    params.push(id);
    const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`;
    bd.run(sql, params, function (error) {
      if (error) return rechazar(error);
      resolver(this.changes > 0);
    });
  });
}

module.exports = {
  crearUsuario,
  buscarUsuarioPorCorreo,
  buscarUsuarioPorId,
  buscarUsuarioAuthPorId,
  actualizarContraseña,
  actualizarNombre,
  actualizarPerfil,
};
