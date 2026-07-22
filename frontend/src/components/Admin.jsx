import { useEffect, useState } from "react";
import {
  cambiarEstadoCita,
  iniciarSesion,
  listarCitas,
} from "../api";

export default function Admin() {
  const [token, setToken] = useState(
    () => localStorage.getItem("medico_token") || ""
  );
  const [correo, setCorreo] = useState("medico@consulta.local");
  const [contraseña, setContraseña] = useState("");
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const data = await listarCitas(token);
        if (!cancelado) setCitas(data);
      } catch (err) {
        if (!cancelado) {
          setError(err.message);
          setToken("");
          localStorage.removeItem("medico_token");
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [token]);

  async function onLogin(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const data = await iniciarSesion(correo, contraseña);
      localStorage.setItem("medico_token", data.token);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("medico_token");
    setToken("");
    setCitas([]);
  }

  async function onEstado(id, estado) {
    try {
      await cambiarEstadoCita(token, id, estado);
      const data = await listarCitas(token);
      setCitas(data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <div className="admin-page">
        <h1>Acceso médico</h1>
        <p className="section-lead">Inicia sesión para ver y gestionar citas.</p>
        <form
          className="agenda-panel"
          style={{ maxWidth: 420, marginTop: "1.5rem" }}
          onSubmit={onLogin}
        >
          <div className="field">
            <label htmlFor="admin-correo">Correo</label>
            <input
              id="admin-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="admin-pass">Contraseña</label>
            <input
              id="admin-pass"
              type="password"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={cargando}>
            {cargando ? "Entrando…" : "Entrar"}
          </button>
          {error ? <p className="alert alert-error">{error}</p> : null}
        </form>
        <p style={{ marginTop: "1.25rem" }}>
          <a href="#/">← Volver al sitio</a>
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1>Citas agendadas</h1>
          <p className="section-lead">Panel privado del consultorio.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "start" }}>
          <a className="btn btn-ghost" href="#/">
            Sitio público
          </a>
          <button className="btn btn-ghost" type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {cargando ? <p className="hint">Cargando…</p> : null}
      {error ? <p className="alert alert-error">{error}</p> : null}

      {!cargando && citas.length === 0 ? (
        <p className="hint">Aún no hay citas registradas.</p>
      ) : (
        <ul className="cita-lista">
          {citas.map((cita) => (
            <li className="cita-item" key={cita.id}>
              <header>
                <span>
                  {cita.fecha} · {cita.hora}
                </span>
                <span style={{ textTransform: "capitalize" }}>{cita.estado}</span>
              </header>
              <div>
                <strong>{cita.nombre_paciente}</strong> · {cita.correo} ·{" "}
                {cita.telefono}
              </div>
              {cita.motivo ? <div>Motivo: {cita.motivo}</div> : null}
              <div className="cita-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => onEstado(cita.id, "confirmada")}
                >
                  Confirmar
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => onEstado(cita.id, "cancelada")}
                >
                  Cancelar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
