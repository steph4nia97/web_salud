import { useEffect, useMemo, useState } from "react";
import {
  agendarCita,
  obtenerCalendarioMesPublico,
  obtenerDisponibilidad,
} from "../api";
import Reveal from "./Reveal";

const PREFIJO_TEL = "+569";
const DIAS_CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const NOMBRES_MES = [
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

const FORM_INICIAL = {
  nombre_paciente: "",
  correo: "",
  telefonoLocal: "",
  motivo: "",
};

function aISO(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function soloLetrasYEspacios(valor) {
  return valor.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g, "");
}

function validarNombre(nombre) {
  const n = nombre.trim();
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(n)) {
    return "El nombre solo puede contener letras y espacios";
  }
  if (n.length < 8 || n.length > 40) {
    return "El nombre debe tener entre 8 y 40 caracteres";
  }
  return null;
}

function validarCorreo(correo) {
  const c = correo.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
    return "Ingresa un correo con formato válido";
  }
  return null;
}

function validarTelefonoLocal(local) {
  if (!/^\d{8}$/.test(local)) {
    return "Debes ingresar exactamente 8 números después de +569";
  }
  return null;
}

export default function Agendar() {
  const hoy = useMemo(() => new Date(), []);
  const [vistaAnio, setVistaAnio] = useState(hoy.getFullYear());
  const [vistaMes, setVistaMes] = useState(hoy.getMonth() + 1);
  const [diasMes, setDiasMes] = useState([]);
  const [cargandoMes, setCargandoMes] = useState(false);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horas, setHoras] = useState([]);
  const [mensajeDisp, setMensajeDisp] = useState("");
  const [cargandoHoras, setCargandoHoras] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const celdasCalendario = useMemo(() => {
    const primero = new Date(vistaAnio, vistaMes - 1, 1);
    let offset = primero.getDay() - 1;
    if (offset < 0) offset = 6;
    const mapa = Object.fromEntries(diasMes.map((d) => [d.fecha, d]));
    const total = new Date(vistaAnio, vistaMes, 0).getDate();
    const celdas = [];

    for (let i = 0; i < offset; i += 1) {
      celdas.push({ key: `e-${i}`, vacia: true });
    }

    for (let d = 1; d <= total; d += 1) {
      const iso = `${vistaAnio}-${String(vistaMes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const info = mapa[iso];
      const disponible = Boolean(info?.disponible);
      celdas.push({
        key: iso,
        vacia: false,
        fecha: iso,
        numero: d,
        disponible,
        pasado: Boolean(info?.pasado),
        seleccionado: iso === fecha,
      });
    }

    return celdas;
  }, [diasMes, fecha, vistaAnio, vistaMes]);

  useEffect(() => {
    let cancelado = false;

    async function cargarMes() {
      setCargandoMes(true);
      try {
        const data = await obtenerCalendarioMesPublico(vistaAnio, vistaMes);
        if (cancelado) return;
        const dias = data.dias || [];
        setDiasMes(dias);

        setFecha((actual) => {
          if (actual) {
            const sigue = dias.find((d) => d.fecha === actual && d.disponible);
            if (sigue) return actual;
          }
          const primera = dias.find((d) => d.disponible);
          return primera?.fecha || "";
        });
      } catch (err) {
        if (!cancelado) {
          setDiasMes([]);
          setError(err.message);
        }
      } finally {
        if (!cancelado) setCargandoMes(false);
      }
    }

    cargarMes();
    return () => {
      cancelado = true;
    };
  }, [vistaAnio, vistaMes]);

  useEffect(() => {
    if (!fecha) {
      setHoras([]);
      setMensajeDisp("Selecciona un día disponible en el calendario.");
      return undefined;
    }

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

  function mesAnterior() {
    if (vistaMes === 1) {
      setVistaMes(12);
      setVistaAnio((a) => a - 1);
    } else {
      setVistaMes((m) => m - 1);
    }
  }

  function mesSiguiente() {
    if (vistaMes === 12) {
      setVistaMes(1);
      setVistaAnio((a) => a + 1);
    } else {
      setVistaMes((m) => m + 1);
    }
  }

  function onChangeNombre(e) {
    const value = soloLetrasYEspacios(e.target.value).slice(0, 40);
    setForm((prev) => ({ ...prev, nombre_paciente: value }));
  }

  function onChangeCorreo(e) {
    setForm((prev) => ({ ...prev, correo: e.target.value }));
  }

  function onChangeTelefono(e) {
    const soloDigitos = e.target.value.replace(/\D/g, "").slice(0, 8);
    setForm((prev) => ({ ...prev, telefonoLocal: soloDigitos }));
  }

  function onChangeMotivo(e) {
    setForm((prev) => ({ ...prev, motivo: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setExito("");

    if (!fecha) {
      setError("Selecciona un día disponible");
      return;
    }
    if (!hora) {
      setError("Selecciona un horario disponible");
      return;
    }

    const errNombre = validarNombre(form.nombre_paciente);
    if (errNombre) {
      setError(errNombre);
      return;
    }
    const errCorreo = validarCorreo(form.correo);
    if (errCorreo) {
      setError(errCorreo);
      return;
    }
    const errTel = validarTelefonoLocal(form.telefonoLocal);
    if (errTel) {
      setError(errTel);
      return;
    }

    const telefono = `${PREFIJO_TEL}${form.telefonoLocal}`;

    setEnviando(true);
    try {
      await agendarCita({
        nombre_paciente: form.nombre_paciente.trim(),
        correo: form.correo.trim(),
        telefono,
        motivo: form.motivo,
        fecha,
        hora,
      });
      setExito(
        `Listo. Tu cita quedó para el ${fecha} a las ${hora}. Te contactaremos a ${form.correo.trim()}.`
      );
      setForm(FORM_INICIAL);
      setHora("");
      const actualizada = await obtenerDisponibilidad(fecha);
      setHoras(actualizada.horasDisponibles || []);
      setMensajeDisp(actualizada.mensaje || "");
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
          <form className="agenda-shell" onSubmit={onSubmit} noValidate>
            <div className="agenda-panel">
              <h3>Fecha y horario</h3>

              <div className="agenda-mini-cal" aria-label="Calendario de citas">
                <div className="mini-cal-nav">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={mesAnterior}
                  >
                    ←
                  </button>
                  <strong>
                    {NOMBRES_MES[vistaMes - 1]} {vistaAnio}
                  </strong>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={mesSiguiente}
                  >
                    →
                  </button>
                </div>

                <div className="mini-cal-cabecera">
                  {DIAS_CABECERA.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                {cargandoMes ? <p className="hint">Cargando mes…</p> : null}

                <div className="mini-cal-grid">
                  {celdasCalendario.map((celda) =>
                    celda.vacia ? (
                      <span key={celda.key} className="mini-cal-vacio" />
                    ) : (
                      <button
                        key={celda.key}
                        type="button"
                        className={`mini-cal-dia${
                          celda.disponible ? " abierto" : " deshabilitado"
                        }${celda.seleccionado ? " seleccionado" : ""}`}
                        disabled={!celda.disponible}
                        onClick={() => setFecha(celda.fecha)}
                        title={
                          celda.disponible
                            ? "Seleccionar este día"
                            : celda.pasado
                              ? "Fecha pasada"
                              : "Día sin atención"
                        }
                      >
                        {celda.numero}
                      </button>
                    )
                  )}
                </div>
              </div>

              {fecha ? (
                <p className="hint agenda-fecha-elegida">
                  Día seleccionado: <strong>{fecha}</strong>
                </p>
              ) : null}

              {cargandoHoras ? (
                <p className="hint">Cargando horarios…</p>
              ) : horas.length === 0 ? (
                <p className="hint">
                  {mensajeDisp || "No hay horarios disponibles para esta fecha."}
                </p>
              ) : (
                <div
                  className="slots"
                  role="group"
                  aria-label="Horarios disponibles"
                >
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
                <label htmlFor="nombre_paciente">Nombre Completo</label>
                <input
                  id="nombre_paciente"
                  name="nombre_paciente"
                  value={form.nombre_paciente}
                  onChange={onChangeNombre}
                  required
                  minLength={8}
                  maxLength={40}
                  pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*"
                  autoComplete="name"
                  placeholder="Ej. María José Pérez"
                />
              </div>
              <div className="field">
                <label htmlFor="correo">Correo</label>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  value={form.correo}
                  onChange={onChangeCorreo}
                  required
                  autoComplete="email"
                  placeholder="nombre@correo.com"
                />
              </div>
              <div className="field">
                <label htmlFor="telefono">Teléfono</label>
                <div className="telefono-con-prefijo">
                  <span className="telefono-prefijo" aria-hidden="true">
                    {PREFIJO_TEL}
                  </span>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    inputMode="numeric"
                    value={form.telefonoLocal}
                    onChange={onChangeTelefono}
                    required
                    minLength={8}
                    maxLength={8}
                    pattern="\d{8}"
                    autoComplete="tel-national"
                    placeholder="12345678"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="motivo">Motivo (opcional)</label>
                <textarea
                  id="motivo"
                  name="motivo"
                  rows={3}
                  value={form.motivo}
                  onChange={onChangeMotivo}
                  placeholder="(Control, Revisión de examenes, Primera Consulta)"
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={enviando || !hora || !fecha}
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
