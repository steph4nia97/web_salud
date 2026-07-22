import { useEffect, useMemo, useState } from "react";
import { agendarCita, obtenerDisponibilidad } from "../api";
import Reveal from "./Reveal";

function fechaMinima() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const FORM_INICIAL = {
  nombre_paciente: "",
  correo: "",
  telefono: "",
  motivo: "",
};

export default function Agendar() {
  const minFecha = useMemo(() => fechaMinima(), []);
  const [fecha, setFecha] = useState(minFecha);
  const [hora, setHora] = useState("");
  const [horas, setHoras] = useState([]);
  const [mensajeDisp, setMensajeDisp] = useState("");
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargandoHoras(true);
      setError("");
      setHora("");
      try {
        const data = await obtenerDisponibilidad(fecha);
        if (cancelado) return;
        setHoras(data.horasDisponibles || []);
        setMensajeDisp(data.mensaje || "");
      } catch (err) {
        if (cancelado) return;
        setHoras([]);
        setMensajeDisp("");
        setError(err.message);
      } finally {
        if (!cancelado) setCargandoHoras(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [fecha]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setExito("");

    if (!hora) {
      setError("Selecciona un horario disponible");
      return;
    }

    setEnviando(true);
    try {
      const data = await agendarCita({
        ...form,
        fecha,
        hora,
      });
      setExito(
        `Listo. Tu cita quedó para el ${fecha} a las ${hora}. Te contactaremos a ${form.correo}.`
      );
      setForm(FORM_INICIAL);
      setHora("");
      const actualizada = await obtenerDisponibilidad(fecha);
      setHoras(actualizada.horasDisponibles || []);
      setMensajeDisp(actualizada.mensaje || "");
      void data;
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="section agendar" id="agendar">
      <div className="section-inner">
        <Reveal>
          <p className="section-label">Agenda</p>
          <h2 className="section-title">Reserva tu hora aquí</h2>
          <p className="section-lead">
            Elige día y horario disponible. Recibirás confirmación con los datos
            que indiques.
          </p>
        </Reveal>

        <Reveal>
          <form className="agenda-shell" onSubmit={onSubmit}>
            <div className="agenda-panel">
              <h3>Fecha y horario</h3>
              <div className="field">
                <label htmlFor="fecha">Fecha</label>
                <input
                  id="fecha"
                  type="date"
                  min={minFecha}
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>

              {cargandoHoras ? (
                <p className="hint">Cargando horarios…</p>
              ) : horas.length === 0 ? (
                <p className="hint">
                  {mensajeDisp || "No hay horarios disponibles para esta fecha."}
                </p>
              ) : (
                <div className="slots" role="group" aria-label="Horarios disponibles">
                  {horas.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`slot${hora === h ? " selected" : ""}`}
                      onClick={() => setHora(h)}
                      aria-pressed={hora === h}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="agenda-panel">
              <h3>Tus datos</h3>
              <div className="field">
                <label htmlFor="nombre_paciente">Nombre completo</label>
                <input
                  id="nombre_paciente"
                  name="nombre_paciente"
                  value={form.nombre_paciente}
                  onChange={onChange}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label htmlFor="correo">Correo</label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={onChange}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={onChange}
                  required
                  autoComplete="tel"
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="field">
                <label htmlFor="motivo">Motivo (opcional)</label>
                <textarea
                  id="motivo"
                  name="motivo"
                  rows={3}
                  value={form.motivo}
                  onChange={onChange}
                  placeholder="Ej. control de presión, revisión de exámenes…"
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={enviando || !hora}
              >
                {enviando ? "Agendando…" : "Confirmar cita"}
              </button>

              {error ? <p className="alert alert-error">{error}</p> : null}
              {exito ? <p className="alert alert-ok">{exito}</p> : null}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
