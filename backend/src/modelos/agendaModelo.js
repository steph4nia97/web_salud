const bd = require("../config/basedatos");

function obtenerEstadoDia(fecha) {
  return new Promise((resolver, rechazar) => {
    bd.get(
      `SELECT abierto FROM dias_agenda WHERE fecha = ?`,
      [fecha],
      (error, fila) => {
        if (error) return rechazar(error);
        resolver(fila ? Boolean(fila.abierto) : null);
      }
    );
  });
}

function obtenerFilaDia(fecha) {
  return new Promise((resolver, rechazar) => {
    bd.get(
      `
      SELECT fecha, abierto, hora_inicio, hora_fin, intervalo
      FROM dias_agenda WHERE fecha = ?
    `,
      [fecha],
      (error, fila) => {
        if (error) return rechazar(error);
        resolver(fila || null);
      }
    );
  });
}

function guardarEstadoDia(fecha, abierto) {
  return new Promise((resolver, rechazar) => {
    bd.run(
      `
      INSERT INTO dias_agenda (fecha, abierto)
      VALUES (?, ?)
      ON CONFLICT(fecha) DO UPDATE SET abierto = excluded.abierto
    `,
      [fecha, abierto ? 1 : 0],
      function (error) {
        if (error) return rechazar(error);
        resolver({ fecha, abierto: Boolean(abierto) });
      }
    );
  });
}

function guardarHorarioDia(fecha, { abierto, horaInicio, horaFin, intervalo }) {
  return new Promise((resolver, rechazar) => {
    bd.run(
      `
      INSERT INTO dias_agenda (fecha, abierto, hora_inicio, hora_fin, intervalo)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(fecha) DO UPDATE SET
        abierto = excluded.abierto,
        hora_inicio = excluded.hora_inicio,
        hora_fin = excluded.hora_fin,
        intervalo = excluded.intervalo
    `,
      [
        fecha,
        abierto ? 1 : 0,
        horaInicio || null,
        horaFin || null,
        intervalo || null,
      ],
      function (error) {
        if (error) return rechazar(error);
        resolver({
          fecha,
          abierto: Boolean(abierto),
          horaInicio: horaInicio || null,
          horaFin: horaFin || null,
          intervalo: intervalo || null,
        });
      }
    );
  });
}

function obtenerHorasBloqueadas(fecha) {
  return new Promise((resolver, rechazar) => {
    bd.all(
      `SELECT hora FROM horas_bloqueadas WHERE fecha = ? ORDER BY hora`,
      [fecha],
      (error, filas) => {
        if (error) return rechazar(error);
        resolver(filas.map((f) => f.hora));
      }
    );
  });
}

function bloquearHora(fecha, hora) {
  return new Promise((resolver, rechazar) => {
    bd.run(
      `
      INSERT OR IGNORE INTO horas_bloqueadas (fecha, hora)
      VALUES (?, ?)
    `,
      [fecha, hora],
      function (error) {
        if (error) return rechazar(error);
        resolver({ fecha, hora, bloqueada: true });
      }
    );
  });
}

function liberarHora(fecha, hora) {
  return new Promise((resolver, rechazar) => {
    bd.run(
      `DELETE FROM horas_bloqueadas WHERE fecha = ? AND hora = ?`,
      [fecha, hora],
      function (error) {
        if (error) return rechazar(error);
        resolver({ fecha, hora, bloqueada: false, changes: this.changes });
      }
    );
  });
}

function bloquearTodasLasHoras(fecha, horas) {
  return new Promise((resolver, rechazar) => {
    bd.serialize(() => {
      const stmt = bd.prepare(
        `INSERT OR IGNORE INTO horas_bloqueadas (fecha, hora) VALUES (?, ?)`
      );
      for (const hora of horas) {
        stmt.run(fecha, hora);
      }
      stmt.finalize((error) => {
        if (error) return rechazar(error);
        resolver({ fecha, horasBloqueadas: horas.length });
      });
    });
  });
}

function liberarTodasLasHoras(fecha) {
  return new Promise((resolver, rechazar) => {
    bd.run(
      `DELETE FROM horas_bloqueadas WHERE fecha = ?`,
      [fecha],
      function (error) {
        if (error) return rechazar(error);
        resolver({ fecha, liberadas: this.changes });
      }
    );
  });
}

function obtenerEstadosEntre(desde, hasta) {
  return new Promise((resolver, rechazar) => {
    bd.all(
      `
      SELECT fecha, abierto FROM dias_agenda
      WHERE fecha BETWEEN ? AND ?
    `,
      [desde, hasta],
      (error, filas) => {
        if (error) return rechazar(error);
        const mapa = {};
        for (const fila of filas) {
          mapa[fila.fecha] = Boolean(fila.abierto);
        }
        resolver(mapa);
      }
    );
  });
}

module.exports = {
  obtenerEstadoDia,
  obtenerFilaDia,
  guardarEstadoDia,
  guardarHorarioDia,
  obtenerHorasBloqueadas,
  bloquearHora,
  liberarHora,
  bloquearTodasLasHoras,
  liberarTodasLasHoras,
  obtenerEstadosEntre,
};
