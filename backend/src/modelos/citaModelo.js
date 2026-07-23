const bd = require("../config/basedatos");

function crearCita({ nombrePaciente, correo, telefono, fecha, hora, motivo }) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      INSERT INTO citas (nombre_paciente, correo, telefono, fecha, hora, motivo)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    bd.run(
      sql,
      [nombrePaciente, correo, telefono, fecha, hora, motivo || null],
      function (error) {
        if (error) return rechazar(error);
        resolver({
          id: this.lastID,
          nombrePaciente,
          correo,
          telefono,
          fecha,
          hora,
          motivo: motivo || null,
          estado: "pendiente",
        });
      }
    );
  });
}

function obtenerCitasPorFecha(fecha) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      SELECT id, nombre_paciente, correo, telefono, fecha, hora, motivo, estado, creado_en
      FROM citas
      WHERE fecha = ? AND estado != 'cancelada'
      ORDER BY hora
    `;
    bd.all(sql, [fecha], (error, filas) => {
      if (error) return rechazar(error);
      resolver(filas);
    });
  });
}

function obtenerHorasOcupadas(fecha) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      SELECT hora FROM citas
      WHERE fecha = ? AND estado != 'cancelada'
    `;
    bd.all(sql, [fecha], (error, filas) => {
      if (error) return rechazar(error);
      resolver(filas.map((f) => f.hora));
    });
  });
}

function obtenerCitasActivasPorFecha(fecha) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      SELECT id, nombre_paciente, correo, hora, estado
      FROM citas
      WHERE fecha = ? AND estado != 'cancelada'
      ORDER BY hora
    `;
    bd.all(sql, [fecha], (error, filas) => {
      if (error) return rechazar(error);
      resolver(filas);
    });
  });
}

function obtenerTodasLasCitas() {
  return new Promise((resolver, rechazar) => {
    const sql = `
      SELECT id, nombre_paciente, correo, telefono, fecha, hora, motivo, estado, creado_en
      FROM citas
      ORDER BY fecha DESC, hora DESC
    `;
    bd.all(sql, [], (error, filas) => {
      if (error) return rechazar(error);
      resolver(filas);
    });
  });
}

function actualizarEstadoCita(id, estado) {
  return new Promise((resolver, rechazar) => {
    const sql = `UPDATE citas SET estado = ? WHERE id = ?`;
    bd.run(sql, [estado, id], function (error) {
      if (error) return rechazar(error);
      if (this.changes === 0) return resolver(null);
      bd.get(
        `SELECT id, nombre_paciente, correo, telefono, fecha, hora, motivo, estado, creado_en
         FROM citas WHERE id = ?`,
        [id],
        (errGet, fila) => {
          if (errGet) return rechazar(errGet);
          resolver(fila || { id, estado });
        }
      );
    });
  });
}

function obtenerCitaPorId(id) {
  return new Promise((resolver, rechazar) => {
    const sql = `
      SELECT id, nombre_paciente, correo, telefono, fecha, hora, motivo, estado, creado_en
      FROM citas WHERE id = ?
    `;
    bd.get(sql, [id], (error, fila) => {
      if (error) return rechazar(error);
      resolver(fila || null);
    });
  });
}

module.exports = {
  crearCita,
  obtenerCitasPorFecha,
  obtenerHorasOcupadas,
  obtenerCitasActivasPorFecha,
  obtenerTodasLasCitas,
  actualizarEstadoCita,
  obtenerCitaPorId,
};
