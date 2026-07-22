export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
  onConfirmar,
  onCancelar,
  cargando = false,
}) {
  if (!abierto) return null;

  return (
    <div
      className="confirm-overlay"
      role="presentation"
      onClick={onCancelar}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensaje"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-titulo">{titulo}</h3>
        <p id="confirm-mensaje">{mensaje}</p>
        <div className="confirm-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={onCancelar}
            disabled={cargando}
          >
            {cancelarTexto}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando ? "Guardando…" : confirmarTexto}
          </button>
        </div>
      </div>
    </div>
  );
}
