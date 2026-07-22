import { useEffect, useState } from "react";
import { enviarCorreoCita, obtenerBorradorCorreo } from "../api";

export default function CorreoCitaDialog({
  abierto,
  token,
  cita,
  tipo,
  onCerrar,
  onEnviado,
}) {
  const [mensaje, setMensaje] = useState("");
  const [para, setPara] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const esConfirmacion = tipo === "confirmacion";
  const titulo = esConfirmacion
    ? "Enviar confirmación por correo"
    : "Enviar cancelación por correo";

  useEffect(() => {
    if (!abierto || !cita || !tipo) return undefined;
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError("");
      try {
        const data = await obtenerBorradorCorreo(token, cita.id, tipo);
        if (cancelado) return;
        setMensaje(data.mensaje || "");
        setPara(data.para || cita.correo);
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
  }, [abierto, token, cita, tipo]);

  async function onEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const data = await enviarCorreoCita(token, cita.id, tipo, mensaje);
      onEnviado?.(data.mensaje);
      onCerrar?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto || !cita) return null;

  return (
    <div className="confirm-overlay" role="presentation" onClick={onCerrar}>
      <div
        className="confirm-dialog correo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="correo-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="correo-titulo">{titulo}</h3>
        <p className="hint">
          Para: <strong>{para}</strong> · {cita.fecha} {cita.hora}
        </p>

        {cargando ? <p className="hint">Cargando texto…</p> : null}
        {error ? <p className="alert alert-error">{error}</p> : null}

        <form onSubmit={onEnviar}>
          <label className="correo-label" htmlFor="correo-mensaje">
            Mensaje {esConfirmacion ? "(puedes editarlo si lo necesitas)" : "(editable)"}
          </label>
          <textarea
            id="correo-mensaje"
            className="correo-textarea"
            rows={12}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            required
            disabled={cargando || enviando}
          />

          <div className="confirm-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={onCerrar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={cargando || enviando || !mensaje.trim()}
            >
              {enviando ? "Enviando…" : "Enviar correo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
