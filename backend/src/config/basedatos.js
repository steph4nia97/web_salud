const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const rutaBD = path.join(__dirname, "../../agenda.db");

const bd = new sqlite3.Database(rutaBD, (error) => {
  if (error) {
    console.error("Error conectando a SQLite:", error.message);
  } else {
    console.log("Conectado a SQLite:", rutaBD);
  }
});

bd.serialize(() => {
  bd.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT UNIQUE NOT NULL,
      contraseña_hash TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('medico', 'admin'))
    )
  `);

  bd.run(`
    CREATE TABLE IF NOT EXISTS citas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_paciente TEXT NOT NULL,
      correo TEXT NOT NULL,
      telefono TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      motivo TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'confirmada', 'cancelada')),
      creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE (fecha, hora)
    )
  `);

  bd.run(`
    CREATE TABLE IF NOT EXISTS dias_agenda (
      fecha TEXT PRIMARY KEY,
      abierto INTEGER NOT NULL CHECK (abierto IN (0, 1)),
      hora_inicio TEXT,
      hora_fin TEXT,
      intervalo INTEGER
    )
  `);

  // Migración suave si la tabla ya existía sin columnas de horario
  bd.run(`ALTER TABLE dias_agenda ADD COLUMN hora_inicio TEXT`, () => {});
  bd.run(`ALTER TABLE dias_agenda ADD COLUMN hora_fin TEXT`, () => {});
  bd.run(`ALTER TABLE dias_agenda ADD COLUMN intervalo INTEGER`, () => {});

  bd.run(`
    CREATE TABLE IF NOT EXISTS horas_bloqueadas (
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      PRIMARY KEY (fecha, hora)
    )
  `);

  bd.run(`
    CREATE TABLE IF NOT EXISTS actividad_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      usuario_nombre TEXT,
      accion TEXT NOT NULL,
      detalle TEXT NOT NULL,
      creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  bd.run(`
    CREATE INDEX IF NOT EXISTS idx_actividad_creado
    ON actividad_log (creado_en)
  `);

  bd.run(`
    CREATE TABLE IF NOT EXISTS horarios_semana (
      dia_semana INTEGER PRIMARY KEY CHECK (dia_semana BETWEEN 1 AND 7),
      abierto INTEGER NOT NULL CHECK (abierto IN (0, 1)),
      hora_inicio TEXT,
      hora_fin TEXT,
      intervalo INTEGER
    )
  `);
});

module.exports = bd;
