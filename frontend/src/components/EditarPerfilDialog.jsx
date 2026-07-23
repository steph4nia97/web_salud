import { useEffect, useState } from "react";
import { actualizarPerfil, obtenerPerfil } from "../api";

export default function EditarPerfilDialog({ abierto, token, onCerrar, onOk }) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(false);

  useEffect(() => {
    if (!abierto) return undefined;
    let cancelado = false;

    async function cargar() {
      setCargandoPerfil(true);
      setError("");
      try {
        const data = await obtenerPerfil(token);
        if (!cancelado) {
          setNombre(data.usuario?.nombre || "");
          setCorreo(data.usuario?.correo || "");
          setActual("");
          setNueva("");
          setRepetir("");
        }
      } catch (err) {
        if (!cancelado) setError(err.message);
      } finally {
        if (!cancelado) setCargandoPerfil(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [abierto, token]);

  if (!abierto) return null;

  function limpiarYCerrar() {
    setActual("");
    setNueva("");
    setRepetir("");
    setError("");
    onCerrar();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!nombre.trim() || !correo.trim()) {
      setError("Nombre y correo son obligatorios.");
      return;
    }
    if (!actual) {
      setError("Confirma con tu contraseña actual.");
      return;
    }
    if (nueva || repetir) {
      if (nueva.length < 6) {
        setError("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (nueva !== repetir) {
        setError("La nueva contraseña y su confirmación no coinciden.");
        return;
      }
    }

    setCargando(true);
    try {
      const data = await actualizarPerfil(token, {
        nombre: nombre.trim(),
        correo: correo.trim(),
        contraseña_actual: actual,
        contraseña_nueva: nueva || undefined,
      });
      onOk(data.mensaje);
      limpiarYCerrar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      className="confirm-overlay"
      role="presentation"
      onClick={limpiarYCerrar}
    >
      <form
        className="confirm-dialog config-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-titulo"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h3 id="perfil-titulo">Editar perfil</h3>
        <p className="hint">
          Los cambios requieren la contraseña actual
        </p>

        {cargandoPerfil ? <p className="hint">Cargando perfil…</p> : null}

        <div className="field">
          <label htmlFor="perfil-nombre">Nombre</label>
          <input
            id="perfil-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={cargandoPerfil}
            autoComplete="name"
          />
        </div>
        <div className="field">
          <label htmlFor="perfil-correo">
            Correo (Borra el correo actual e ingresa el nuevo)
          </label>
          <input
            id="perfil-correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            disabled={cargandoPerfil}
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label htmlFor="perfil-actual">Contraseña actual</label>
          <input
            id="perfil-actual"
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="field">
          <label htmlFor="perfil-nueva">Nueva contraseña (opcional)</label>
          <input
            id="perfil-nueva"
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label htmlFor="perfil-repetir">Repetir nueva (si cambias)</label>
          <input
            id="perfil-repetir"
            type="password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        {error ? <p className="alert alert-error">{error}</p> : null}

        <div className="confirm-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={limpiarYCerrar}
            disabled={cargando}
          >
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={cargando || cargandoPerfil}
          >
            {cargando ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
