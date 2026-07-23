import { useEffect, useRef, useState } from "react";

export default function MenuHamburguesa({
  onEditarPerfil,
  onHistorial,
  onCerrarSesion,
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false);
      }
    }

    function onEsc(e) {
      if (e.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [abierto]);

  function elegir(fn) {
    setAbierto(false);
    fn();
  }

  return (
    <div className="menu-hamb" ref={ref}>
      <button
        className={`menu-hamb-btn${abierto ? " abierto" : ""}`}
        type="button"
        aria-label="Menú de configuración"
        aria-expanded={abierto}
        aria-haspopup="menu"
        onClick={() => setAbierto((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {abierto ? (
        <div className="menu-hamb-panel" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => elegir(onEditarPerfil)}
          >
            Editar perfil
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => elegir(onHistorial)}
          >
            Historial de acciones
          </button>
          <hr />
          <button
            type="button"
            role="menuitem"
            className="menu-hamb-peligro"
            onClick={() => elegir(onCerrarSesion)}
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
