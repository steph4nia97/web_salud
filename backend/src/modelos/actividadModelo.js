const bd = require("../config/basedatos");

function registrarActividad({
  usuarioId = null,
  usuarioNombre = null,
  accion,
  detalle,
}) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      INSERT INTO actividad_log (usuario_id, usuario_nombre, accion, detalle)
      VALUES (?, ?, ?, ?)
    `;
    bd.run(
      sql,
      [usuarioId, usuarioNombre, accion, detalle],
      function (error) {
        if (error) return rechazar(error);
        resolver({ id: this.lastID, accion, detalle });
      }
    );
  });
}

function listarActividad({ desde, hasta, accion } = {}) {
  return new Promise((resolver, rechazar) => {
    const condiciones = [];
    const params = [];

    if (desde) {
      condiciones.push(`date(creado_en) >= date(?)`);
      params.push(desde);
    }
    if (hasta) {
      condiciones.push(`date(creado_en) <= date(?)`);
      params.push(hasta);
    }
    if (accion) {
      condiciones.push(`accion = ?`);
      params.push(accion);
    }

    const where = condiciones.length
      ? `WHERE ${condiciones.join(" AND ")}`
      : "";

    const sql = `
      SELECT id, usuario_id, usuario_nombre, accion, detalle, creado_en
      FROM actividad_log
      ${where}
      ORDER BY creado_en DESC, id DESC
    `;

    bd.all(sql, params, (error, filas) => {
      if (error) return rechazar(error);
      resolver(filas || []);
    });
  });
}

module.exports = {
  registrarActividad,
  listarActividad,
};
