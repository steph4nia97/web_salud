import { useEffect, useMemo, useState } from "react";
import {
  alternarHoraAgenda,
  cambiarEstadoCita,
  configurarDiaAgenda,
  configurarHorarioAgenda,
  obtenerConfigAgenda,
  obtenerMesAgenda,
} from "../api";
import ConfirmDialog from "./ConfirmDialog";

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

const DIAS_CABECERA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const INTERVALOS = [10, 15, 20, 30, 45, 60];

function partsFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return { anio: y, mes: m, dia: d };
}

function formatearFechaCorta(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ControlAgenda({
  token,
  fecha,
  onMensaje,
  onCambiarFecha,
  onCitasCambiadas,
}) {
  const inicial = partsFecha(fecha);
  const [config, setConfig] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [vistaAnio, setVistaAnio] = useState(inicial.anio);
  const [vistaMes, setVistaMes] = useState(inicial.mes);
  const [diasMes, setDiasMes] = useState([]);
  const [cargandoMes, setCargandoMes] = useState(false);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("18:00");
  const [intervalo, setIntervalo] = useState(30);
  const [confirmacion, setConfirmacion] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [modoAbrirCerrar, setModoAbrirCerrar] = useState(false);

  useEffect(() => {
    const p = partsFecha(fecha);
    setVistaAnio(p.anio);
    setVistaMes(p.mes);
  }, [fecha]);

  useEffect(() => {
    let cancelado = false;

    async function cargarDia() {
      setCargando(true);
      setError("");
      try {
        const data = await obtenerConfigAgenda(token, fecha);
        if (cancelado) return;
        setConfig(data);
        if (data.horario) {
          setHoraInicio(data.horario.horaInicio);
          setHoraFin(data.horario.horaFin);
          setIntervalo(data.horario.intervalo);
        }
      } catch (err) {
        if (!cancelado) setError(err.message);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarDia();
    return () => {
      cancelado = true;
    };
  }, [token, fecha]);

  useEffect(() => {
    let cancelado = false;

    async function cargarMes() {
      setCargandoMes(true);
      try {
        const data = await obtenerMesAgenda(token, vistaAnio, vistaMes);
        if (!cancelado) setDiasMes(data.dias || []);
      } catch (err) {
        if (!cancelado) setError(err.message);
      } finally {
        if (!cancelado) setCargandoMes(false);
      }
    }

    cargarMes();
    return () => {
      cancelado = true;
    };
  }, [token, vistaAnio, vistaMes]);

  const celdasCalendario = useMemo(() => {
    const mapa = Object.fromEntries(diasMes.map((d) => [d.fecha, d]));
    const primero = new Date(vistaAnio, vistaMes - 1, 1);
    let offset = primero.getDay() - 1;
    if (offset < 0) offset = 6;

    const celdas = [];
    for (let i = 0; i < offset; i += 1) {
      celdas.push({ key: `e-${i}`, vacia: true });
    }

    const totalDias = new Date(vistaAnio, vistaMes, 0).getDate();
    for (let d = 1; d <= totalDias; d += 1) {
      const iso = `${vistaAnio}-${String(vistaMes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const info = mapa[iso] || { fecha: iso, abierto: false };
      celdas.push({
        key: iso,
        vacia: false,
        fecha: iso,
        numero: d,
        abierto: info.abierto,
        seleccionado: iso === fecha,
      });
    }

    return celdas;
  }, [diasMes, vistaAnio, vistaMes, fecha]);

  function pedirConfirmacion(payload) {
    setConfirmacion(payload);
  }

  function cancelarConfirmacion() {
    if (confirmando) return;
    setConfirmacion(null);
  }

  async function ejecutarConfirmacion() {
    if (!confirmacion) return;
    setConfirmando(true);
    setError("");

    try {
      if (confirmacion.tipo === "rango") {
        const data = await configurarHorarioAgenda(
          token,
          fecha,
          horaInicio,
          horaFin,
          intervalo
        );
        setConfig(data);
        onMensaje?.(data.mensaje);
        const mes = await obtenerMesAgenda(token, vistaAnio, vistaMes);
        setDiasMes(mes.dias || []);
      }

      if (confirmacion.tipo === "hora") {
        const { hora, bloquear } = confirmacion;
        const data = await alternarHoraAgenda(token, fecha, hora, bloquear);
        setConfig(data);
        onMensaje?.(bloquear ? "Hora bloqueada" : "Hora liberada");
        const mes = await obtenerMesAgenda(token, vistaAnio, vistaMes);
        setDiasMes(mes.dias || []);
      }

      if (confirmacion.tipo === "liberar-cita") {
        const { citaId } = confirmacion;
        await cambiarEstadoCita(token, citaId, "cancelada");
        const data = await obtenerConfigAgenda(token, fecha);
        setConfig(data);
        onMensaje?.("La hora quedó disponible nuevamente");
        onCitasCambiadas?.();
        const mes = await obtenerMesAgenda(token, vistaAnio, vistaMes);
        setDiasMes(mes.dias || []);
      }

      if (confirmacion.tipo === "dia") {
        const { dia, nuevoAbierto } = confirmacion;
        onCambiarFecha?.(dia.fecha);
        const data = await configurarDiaAgenda(token, dia.fecha, nuevoAbierto);
        setConfig(data);
        onMensaje?.(data.mensaje);
        setDiasMes((prev) =>
          prev.map((d) =>
            d.fecha === dia.fecha
              ? { ...d, abierto: nuevoAbierto, override: true }
              : d
          )
        );
      }

      setConfirmacion(null);
    } catch (err) {
      setError(err.message);
      setConfirmacion(null);
    } finally {
      setConfirmando(false);
    }
  }

  function onToggleHora(slot) {
    const { hora, estado } = slot;

    if (estado === "ocupada") {
      pedirConfirmacion({
        tipo: "liberar-cita",
        citaId: slot.citaId,
        titulo: "¿Liberar esta hora agendada?",
        mensaje:
          `La cita de ${slot.paciente || "el paciente"} a las ${hora} se cancelará ` +
          "y el horario volverá a estar disponible para agendar.",
        confirmarTexto: "Sí, liberar hora",
      });
      return;
    }

    const bloquear = estado === "libre";
    pedirConfirmacion({
      tipo: "hora",
      hora,
      bloquear,
      titulo: bloquear ? "¿Bloquear esta hora?" : "¿Liberar esta hora?",
      mensaje: bloquear
        ? `La hora ${hora} quedará bloqueada y los pacientes no podrán agendarla.`
        : `La hora ${hora} quedará libre para que los pacientes puedan agendar.`,
      confirmarTexto: bloquear ? "Sí, bloquear" : "Sí, liberar",
    });
  }

  function onPedirAplicarRango(e) {
    e.preventDefault();
    pedirConfirmacion({
      tipo: "rango",
      titulo: "¿Aplicar estos horarios?",
      mensaje: `Se generarán cupos el ${formatearFechaCorta(fecha)} desde ${horaInicio} hasta ${horaFin}, cada ${intervalo} minutos. El día quedará abierto.`,
      confirmarTexto: "Sí, aplicar",
    });
  }

  function onClickDiaCalendario(dia) {
    if (dia.vacia) return;

    // Modo normal: ir al detalle de pacientes / horarios de ese día
    if (!modoAbrirCerrar) {
      onCambiarFecha?.(dia.fecha);
      return;
    }

    // Modo abrir/cerrar: pedir confirmación
    const nuevoAbierto = !dia.abierto;
    pedirConfirmacion({
      tipo: "dia",
      dia,
      nuevoAbierto,
      titulo: nuevoAbierto ? "¿Abrir este día?" : "¿Cerrar este día?",
      mensaje: nuevoAbierto
        ? `${formatearFechaCorta(dia.fecha)} quedará disponible para agendar.`
        : `${formatearFechaCorta(dia.fecha)} se cerrará y los pacientes no verán horarios ese día.`,
      confirmarTexto: nuevoAbierto ? "Sí, abrir" : "Sí, cerrar",
    });
  }

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

  return (
    <>
      <div className="agenda-layout">
      <section className="control-agenda" aria-label="Horarios del día">
        <div className="detalle-dia-header">
          <h2>Horarios del día</h2>
          <span className="detalle-dia-badge">
            Define el rango y luego bloquea horas sueltas
          </span>
        </div>

        <form className="rango-horario" onSubmit={onPedirAplicarRango}>
          <label>
            Desde
            <input
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              required
            />
          </label>
          <label>
            Hasta
            <input
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              required
            />
          </label>
          <label>
            Cada
            <select
              value={intervalo}
              onChange={(e) => setIntervalo(Number(e.target.value))}
            >
              {INTERVALOS.map((min) => (
                <option key={min} value={min}>
                  {min} minutos
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary" type="submit">
            Aplicar horarios
          </button>
        </form>

        {config?.horario ? (
          <p className="hint">
            Rango activo: {config.horario.horaInicio} – {config.horario.horaFin}{" "}
            · cada {config.horario.intervalo} min
          </p>
        ) : (
          <p className="hint">
            Si no defines un rango, se usan los horarios por defecto.
          </p>
        )}

        {cargando ? <p className="hint">Cargando horarios…</p> : null}
        {error ? <p className="alert alert-error">{error}</p> : null}

        {config ? (
          <>
            <div className="mini-cal-leyenda">
              <span>
                <i className="punto libre" /> Libre
              </span>
              <span>
                <i className="punto bloqueada" /> Bloqueada
              </span>
              <span>
                <i className="punto ocupada" /> Agendada (clic para liberar)
              </span>
            </div>

            <div className="agenda-horas" role="group" aria-label="Horarios">
              {config.horas.map((slot) => (
                <button
                  key={slot.hora}
                  type="button"
                  className={`hora-chip estado-${slot.estado}`}
                  onClick={() => onToggleHora(slot)}
                  aria-pressed={slot.estado === "bloqueada"}
                  title={
                    slot.estado === "ocupada"
                      ? "Clic para liberar esta hora agendada"
                      : "Clic para confirmar el cambio"
                  }
                >
                  <span>{slot.hora}</span>
                  <small>
                    {slot.estado === "libre"
                      ? "Libre"
                      : slot.estado === "bloqueada"
                        ? "Bloqueada"
                        : "Agendada"}
                  </small>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="mini-calendario-panel" aria-label="Calendario de días">
        <div className="detalle-dia-header">
          <h2>Calendario</h2>
          <span className="detalle-dia-badge">
            {modoAbrirCerrar
              ? "Modo abrir/cerrar activo"
              : "Clic en un día para ver pacientes"}
          </span>
        </div>

        <button
          className={`btn modo-calendario-btn${modoAbrirCerrar ? " activo" : " btn-ghost"}`}
          type="button"
          onClick={() => setModoAbrirCerrar((v) => !v)}
          aria-pressed={modoAbrirCerrar}
        >
          {modoAbrirCerrar
            ? "Desactivar abrir/cerrar días"
            : "Activar abrir/cerrar días"}
        </button>

        {modoAbrirCerrar ? (
          <p className="hint">
            Ahora un clic en el día pedirá confirmación para abrirlo o
            cerrarlo.
          </p>
        ) : (
          <p className="hint">
            Un clic en el día muestra el detalle de pacientes agendados abajo.
          </p>
        )}

        <div className="mini-cal-nav">
          <button className="btn btn-ghost" type="button" onClick={mesAnterior}>
            ←
          </button>
          <strong>
            {NOMBRES_MES[vistaMes - 1]} {vistaAnio}
          </strong>
          <button className="btn btn-ghost" type="button" onClick={mesSiguiente}>
            →
          </button>
        </div>

        <div className="mini-cal-cabecera">
          {DIAS_CABECERA.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        {cargandoMes ? <p className="hint">Cargando mes…</p> : null}

        <div
          className={`mini-cal-grid${modoAbrirCerrar ? " modo-edicion" : ""}`}
        >
          {celdasCalendario.map((celda) =>
            celda.vacia ? (
              <span key={celda.key} className="mini-cal-vacio" />
            ) : (
              <button
                key={celda.key}
                type="button"
                className={`mini-cal-dia${celda.abierto ? " abierto" : " cerrado"}${celda.seleccionado ? " seleccionado" : ""}`}
                onClick={() => onClickDiaCalendario(celda)}
                title={
                  modoAbrirCerrar
                    ? celda.abierto
                      ? "Clic para cerrar este día"
                      : "Clic para abrir este día"
                    : "Clic para ver pacientes de este día"
                }
              >
                {celda.numero}
              </button>
            )
          )}
        </div>

        <div className="mini-cal-leyenda">
          <span>
            <i className="punto abierto" /> Abierto
          </span>
          <span>
            <i className="punto cerrado" /> Cerrado
          </span>
        </div>
      </section>
      </div>

      <ConfirmDialog
        abierto={Boolean(confirmacion)}
        titulo={confirmacion?.titulo || ""}
        mensaje={confirmacion?.mensaje || ""}
        confirmarTexto={confirmacion?.confirmarTexto || "Confirmar"}
        onConfirmar={ejecutarConfirmacion}
        onCancelar={cancelarConfirmacion}
        cargando={confirmando}
      />
    </>
  );
}
