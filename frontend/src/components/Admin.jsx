import { useEffect, useMemo, useState } from "react";
import {
  cambiarEstadoCita,
  iniciarSesion,
  listarCitas,
} from "../api";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Lunes de la semana que contiene `fecha`. */
function inicioSemana(fecha) {
  const d = new Date(fecha);
  d.setHours(12, 0, 0, 0);
  const dia = d.getDay(); // 0=domingo
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  return d;
}

function diasDeSemana(lunes) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

function formatearFechaLarga(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function esActiva(cita) {
  return cita.estado !== "cancelada";
}

export default function Admin() {
  const [token, setToken] = useState(
    () => localStorage.getItem("medico_token") || ""
  );
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [semanaRef, setSemanaRef] = useState(() => inicioSemana(new Date()));
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => aISO(new Date()));

  const diasSemana = useMemo(() => diasDeSemana(semanaRef), [semanaRef]);

  const resumenSemana = useMemo(() => {
    return diasSemana.map((dia, indice) => {
      const iso = aISO(dia);
      const delDia = citas.filter((c) => c.fecha === iso && esActiva(c));
      return {
        iso,
        etiqueta: DIAS_SEMANA[indice],
        numero: dia.getDate(),
        total: delDia.length,
      };
    });
  }, [citas, diasSemana]);

  const maxBarras = useMemo(() => {
    const max = Math.max(0, ...resumenSemana.map((d) => d.total));
    return Math.max(max, 1);
  }, [resumenSemana]);

  const citasDelDia = useMemo(() => {
    return citas
      .filter((c) => c.fecha === diaSeleccionado)
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [citas, diaSeleccionado]);

  const rangoSemanaTexto = useMemo(() => {
    const inicio = diasSemana[0];
    const fin = diasSemana[6];
    const opts = { day: "numeric", month: "short" };
    return `${inicio.toLocaleDateString("es-CL", opts)} – ${fin.toLocaleDateString("es-CL", opts)}`;
  }, [diasSemana]);

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

  function semanaAnterior() {
    const d = new Date(semanaRef);
    d.setDate(d.getDate() - 7);
    setSemanaRef(d);
  }

  function semanaSiguiente() {
    const d = new Date(semanaRef);
    d.setDate(d.getDate() + 7);
    setSemanaRef(d);
  }

  function irAHoy() {
    const hoy = new Date();
    setSemanaRef(inicioSemana(hoy));
    setDiaSeleccionado(aISO(hoy));
  }

  if (!token) {
    return (
      <div className="admin-page">
        <h1>Acceso médico</h1>
        <p className="section-lead">Área privada. Solo personal autorizado.</p>
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
      <div className="admin-top">
        <div>
          <h1>Panel médico</h1>
          <p className="section-lead">Resumen semanal y detalle por día.</p>
        </div>
        <div className="admin-top-actions">
          <a className="btn btn-ghost" href="#/">
            Sitio público
          </a>
          <button className="btn btn-ghost" type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {error ? <p className="alert alert-error">{error}</p> : null}

      <section className="semana-panel" aria-label="Resumen de la semana">
        <div className="semana-nav">
          <button className="btn btn-ghost" type="button" onClick={semanaAnterior}>
            ← Semana anterior
          </button>
          <div className="semana-rango">
            <strong>{rangoSemanaTexto}</strong>
            <button className="btn-link" type="button" onClick={irAHoy}>
              Ir a hoy
            </button>
          </div>
          <button className="btn btn-ghost" type="button" onClick={semanaSiguiente}>
            Semana siguiente →
          </button>
        </div>

        <div className="semana-barras" role="list">
          {resumenSemana.map((dia) => {
            const activo = dia.iso === diaSeleccionado;
            const altura = `${(dia.total / maxBarras) * 100}%`;
            return (
              <button
                key={dia.iso}
                type="button"
                role="listitem"
                className={`dia-barra${activo ? " selected" : ""}`}
                onClick={() => setDiaSeleccionado(dia.iso)}
                aria-pressed={activo}
                title={`${dia.etiqueta} ${dia.numero}: ${dia.total} cita(s)`}
              >
                <div className="dia-barra-track" aria-hidden="true">
                  {dia.total === 0 ? (
                    <span className="dia-barra-vacia" />
                  ) : (
                    <span className="dia-barra-fill" style={{ height: altura }}>
                      {Array.from({ length: dia.total }, (_, i) => (
                        <span key={i} className="dia-barra-segmento" />
                      ))}
                    </span>
                  )}
                </div>
                <span className="dia-barra-count">{dia.total}</span>
                <span className="dia-barra-label">{dia.etiqueta}</span>
                <span className="dia-barra-num">{dia.numero}</span>
              </button>
            );
          })}
        </div>
        <p className="hint">
          Haz clic en un día para ver solo las citas de esa fecha.
        </p>
      </section>

      <section className="detalle-dia" aria-label="Detalle del día">
        <div className="detalle-dia-header">
          <h2>
            {formatearFechaLarga(diaSeleccionado)}
          </h2>
          <span className="detalle-dia-badge">
            {citasDelDia.filter(esActiva).length} activa(s) · {citasDelDia.length}{" "}
            en total
          </span>
        </div>

        {cargando ? <p className="hint">Cargando…</p> : null}

        {!cargando && citasDelDia.length === 0 ? (
          <p className="hint">No hay citas agendadas para este día.</p>
        ) : (
          <ul className="cita-lista">
            {citasDelDia.map((cita) => (
              <li className="cita-item" key={cita.id}>
                <header>
                  <span>{cita.hora}</span>
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
                    disabled={cita.estado === "confirmada"}
                  >
                    Confirmar
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => onEstado(cita.id, "cancelada")}
                    disabled={cita.estado === "cancelada"}
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
