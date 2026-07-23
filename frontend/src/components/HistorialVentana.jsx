import { useEffect, useMemo, useRef, useState } from "react";
import { exportarHistorialExcel, listarHistorial } from "../api";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ACCIONES_FALLBACK = [
  { id: "login", etiqueta: "Inicio de sesión" },
  { id: "cambio_contraseña", etiqueta: "Cambio de contraseña" },
  { id: "editar_perfil", etiqueta: "Editar perfil" },
  { id: "cita_agendada", etiqueta: "Cita agendada" },
  { id: "cita_confirmada", etiqueta: "Cita confirmada" },
  { id: "cita_cancelada", etiqueta: "Cita cancelada" },
  { id: "correo_enviado", etiqueta: "Correo enviado" },
  { id: "dia_abierto", etiqueta: "Día abierto" },
  { id: "dia_cerrado", etiqueta: "Día cerrado" },
  { id: "horario_aplicado", etiqueta: "Horario aplicado" },
  { id: "horario_semana", etiqueta: "Horario semanal" },
  { id: "semana_abierta", etiqueta: "Semana abierta" },
  { id: "semana_cerrada", etiqueta: "Semana cerrada" },
  { id: "hora_bloqueada", etiqueta: "Hora bloqueada" },
  { id: "hora_liberada", etiqueta: "Hora liberada" },
];

const AUTO_KEY = "historial_auto_excel";

function leerAutoConfig() {
  try {
    const raw = localStorage.getItem(AUTO_KEY);
    if (!raw) return { activo: false, cadaDias: 7, ultima: null };
    const data = JSON.parse(raw);
    const cadaDias = Math.min(31, Math.max(1, Number(data.cadaDias) || 7));
    return {
      activo: Boolean(data.activo),
      cadaDias,
      ultima: data.ultima || null,
    };
  } catch {
    return { activo: false, cadaDias: 7, ultima: null };
  }
}

function guardarAutoConfig(config) {
  localStorage.setItem(AUTO_KEY, JSON.stringify(config));
}

function debeExportarAuto(config) {
  if (!config.activo) return false;
  if (!config.ultima) return true;
  const ultima = new Date(config.ultima);
  if (Number.isNaN(ultima.getTime())) return true;
  const diffMs = Date.now() - ultima.getTime();
  const dias = diffMs / (1000 * 60 * 60 * 24);
  return dias >= config.cadaDias;
}

function formatearFechaGrupo(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HistorialVentana({ abierto, token, onCerrar }) {
  const ahora = useMemo(() => new Date(), []);
  const [anio, setAnio] = useState(ahora.getFullYear());
  const [mes, setMes] = useState(ahora.getMonth() + 1);
  const [filtroAccion, setFiltroAccion] = useState("");
  const [acciones, setAcciones] = useState(ACCIONES_FALLBACK);
  const [dias, setDias] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [autoActivo, setAutoActivo] = useState(false);
  const [autoCadaDias, setAutoCadaDias] = useState(7);
  const [autoUltima, setAutoUltima] = useState(null);
  const autoHechoRef = useRef(false);

  useEffect(() => {
    const cfg = leerAutoConfig();
    setAutoActivo(cfg.activo);
    setAutoCadaDias(cfg.cadaDias);
    setAutoUltima(cfg.ultima);
  }, []);

  useEffect(() => {
    if (!abierto) {
      autoHechoRef.current = false;
      return undefined;
    }
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");
      setAviso("");
      try {
        const data = await listarHistorial(token, {
          anio,
          mes,
          accion: filtroAccion || undefined,
        });
        if (!cancelado) {
          setDias(data.dias || []);
          setTotal(data.total || 0);
          if (data.acciones?.length) setAcciones(data.acciones);
        }
      } catch (err) {
        if (!cancelado) setError(err.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [abierto, token, anio, mes, filtroAccion]);

  useEffect(() => {
    if (!abierto || !token || autoHechoRef.current) return undefined;

    const cfg = {
      activo: autoActivo,
      cadaDias: autoCadaDias,
      ultima: autoUltima,
    };
    if (!debeExportarAuto(cfg)) return undefined;

    let cancelado = false;
    autoHechoRef.current = true;

    async function autoExportar() {
      setExportando(true);
      try {
        await exportarHistorialExcel(token, null, null, { completo: true });
        if (cancelado) return;
        const ahoraIso = new Date().toISOString();
        const nuevo = { ...cfg, ultima: ahoraIso };
        guardarAutoConfig(nuevo);
        setAutoUltima(ahoraIso);
        setAviso(
          `Excel completo exportado automáticamente (cada ${cfg.cadaDias} día(s)).`
        );
      } catch (err) {
        if (!cancelado) setError(err.message);
        autoHechoRef.current = false;
      } finally {
        if (!cancelado) setExportando(false);
      }
    }

    autoExportar();
    return () => {
      cancelado = true;
    };
  }, [abierto, token, autoActivo, autoCadaDias, autoUltima]);

  function guardarOpcionAuto(activo, cadaDias) {
    const cfg = {
      activo,
      cadaDias,
      ultima: autoUltima,
    };
    guardarAutoConfig(cfg);
    setAutoActivo(activo);
    setAutoCadaDias(cadaDias);
    setAviso(
      activo
        ? `Exportación automática activada cada ${cadaDias} día(s).`
        : "Exportación automática desactivada."
    );
  }

  async function onExportar() {
    setExportando(true);
    setError("");
    setAviso("");
    try {
      await exportarHistorialExcel(token, anio, mes, {
        accion: filtroAccion,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setExportando(false);
    }
  }

  if (!abierto) return null;

  const anios = [ahora.getFullYear(), ahora.getFullYear() - 1];
  const diasOpciones = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="historial-overlay" role="presentation">
      <div
        className="historial-ventana"
        role="dialog"
        aria-modal="true"
        aria-labelledby="historial-titulo"
      >
        <header className="historial-header">
          <div>
            <h2 id="historial-titulo">Historial de acciones</h2>
            <p className="hint">
              Al exportar: 1 hoja si es la misma acción; varias hojas si hay
              distintas.
            </p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onCerrar}>
            Cerrar
          </button>
        </header>

        <div className="historial-toolbar">
          <div className="historial-filtros">
            <label>
              Mes
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {MESES.map((nombre, i) => (
                  <option key={nombre} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Año
              <select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
              >
                {anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ver acción
              <select
                value={filtroAccion}
                onChange={(e) => setFiltroAccion(e.target.value)}
              >
                <option value="">Todas</option>
                {acciones.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.etiqueta}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onExportar}
            disabled={exportando || total === 0}
          >
            {exportando ? "Exportando…" : "Exportar Excel"}
          </button>
        </div>

        <div className="historial-auto">
          <label className="historial-auto-check">
            <input
              type="checkbox"
              checked={autoActivo}
              onChange={(e) =>
                guardarOpcionAuto(e.target.checked, autoCadaDias)
              }
            />
            Exportar Excel completo automáticamente (opcional)
          </label>
          <label>
            Cada
            <select
              value={autoCadaDias}
              disabled={!autoActivo}
              onChange={(e) =>
                guardarOpcionAuto(autoActivo, Number(e.target.value))
              }
            >
              {diasOpciones.map((d) => (
                <option key={d} value={d}>
                  {d} día{d === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
          {autoActivo && autoUltima ? (
            <p className="hint">
              Última exportación automática:{" "}
              {new Date(autoUltima).toLocaleString("es-CL")}
            </p>
          ) : (
            <p className="hint">
              Al marcar la casilla, la exportación automática comienza a regir
              cada la cantidad de días elegida.
            </p>
          )}
        </div>

        {error ? <p className="alert alert-error">{error}</p> : null}
        {aviso ? <p className="alert alert-ok">{aviso}</p> : null}
        {cargando ? <p className="hint">Cargando…</p> : null}

        {!cargando && total === 0 ? (
          <p className="hint historial-vacio">
            No hay acciones registradas con este filtro.
          </p>
        ) : null}

        <div className="historial-lista">
          {dias.map((grupo) => (
            <section key={grupo.fecha} className="historial-dia">
              <h3>{formatearFechaGrupo(grupo.fecha)}</h3>
              <ul>
                {grupo.eventos.map((ev) => (
                  <li key={ev.id}>
                    <time>{ev.hora}</time>
                    <div>
                      <strong>{ev.etiqueta}</strong>
                      <span>{ev.detalle}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
