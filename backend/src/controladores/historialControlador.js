const ExcelJS = require("exceljs");
const { listarActividad } = require("../modelos/actividadModelo");

const ETIQUETAS_ACCION = {
  login: "Inicio de sesión",
  cambio_contraseña: "Cambio de contraseña",
  editar_perfil: "Editar perfil",
  cita_agendada: "Cita agendada",
  cita_confirmada: "Cita confirmada",
  cita_cancelada: "Cita cancelada",
  correo_enviado: "Correo enviado",
  dia_abierto: "Día abierto",
  dia_cerrado: "Día cerrado",
  horario_aplicado: "Horario aplicado",
  horario_semana: "Horario semanal",
  semana_abierta: "Semana abierta",
  semana_cerrada: "Semana cerrada",
  hora_bloqueada: "Hora bloqueada",
  hora_liberada: "Hora liberada",
};

const COLUMNAS = [
  { header: "Fecha", key: "fecha", width: 12 },
  { header: "Hora", key: "hora", width: 8 },
  { header: "Acción", key: "accion", width: 22 },
  { header: "Detalle", key: "detalle", width: 55 },
  { header: "Usuario", key: "usuario", width: 22 },
];

function rangoMes(anio, mes) {
  const ultimo = new Date(anio, mes, 0).getDate();
  const mm = String(mes).padStart(2, "0");
  return {
    desde: `${anio}-${mm}-01`,
    hasta: `${anio}-${mm}-${String(ultimo).padStart(2, "0")}`,
  };
}

function fechaDeCreado(creadoEn) {
  return String(creadoEn || "").slice(0, 10);
}

function horaDeCreado(creadoEn) {
  const parte = String(creadoEn || "");
  return parte.length >= 19 ? parte.slice(11, 16) : "";
}

function nombreHojaSeguro(texto) {
  const limpio = String(texto || "Acción")
    .replace(/[\\/*?[\]:]/g, " ")
    .trim()
    .slice(0, 28);
  return limpio || "Accion";
}

function filaExcel(fila) {
  return {
    fecha: fechaDeCreado(fila.creado_en),
    hora: horaDeCreado(fila.creado_en),
    accion: ETIQUETAS_ACCION[fila.accion] || fila.accion,
    detalle: fila.detalle,
    usuario: fila.usuario_nombre || "—",
  };
}

function agregarHoja(workbook, nombre, filas) {
  const sheet = workbook.addWorksheet(nombreHojaSeguro(nombre));
  sheet.columns = COLUMNAS;
  sheet.getRow(1).font = { bold: true };
  for (const fila of filas) {
    sheet.addRow(filaExcel(fila));
  }
  return sheet;
}

async function listarHistorial(req, res) {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);
    const accion = req.query.accion || null;
    let desde = req.query.desde;
    let hasta = req.query.hasta;

    if (anio && mes >= 1 && mes <= 12) {
      ({ desde, hasta } = rangoMes(anio, mes));
    }

    if (accion && !ETIQUETAS_ACCION[accion]) {
      return res.status(400).json({ mensaje: "Tipo de acción no válido" });
    }

    const filas = await listarActividad({ desde, hasta, accion });
    const agrupado = [];
    const porFecha = new Map();

    for (const fila of filas) {
      const fecha = fechaDeCreado(fila.creado_en) || "Sin fecha";
      if (!porFecha.has(fecha)) {
        const grupo = { fecha, eventos: [] };
        porFecha.set(fecha, grupo);
        agrupado.push(grupo);
      }
      porFecha.get(fecha).eventos.push({
        id: fila.id,
        hora: horaDeCreado(fila.creado_en),
        accion: fila.accion,
        etiqueta: ETIQUETAS_ACCION[fila.accion] || fila.accion,
        detalle: fila.detalle,
        usuario: fila.usuario_nombre || "—",
        creado_en: fila.creado_en,
      });
    }

    res.json({
      desde: desde || null,
      hasta: hasta || null,
      accion: accion || null,
      total: filas.length,
      dias: agrupado,
      acciones: Object.entries(ETIQUETAS_ACCION).map(([id, etiqueta]) => ({
        id,
        etiqueta,
      })),
    });
  } catch (error) {
    console.error("Error en listarHistorial:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function exportarHistorialExcel(req, res) {
  try {
    const completo = String(req.query.completo || "") === "1";
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);
    const accion = req.query.accion || null;

    if (!completo && (!anio || !mes || mes < 1 || mes > 12)) {
      return res.status(400).json({
        mensaje: "Debes enviar anio y mes (1-12), o completo=1",
      });
    }

    if (accion && !ETIQUETAS_ACCION[accion]) {
      return res.status(400).json({ mensaje: "Tipo de acción no válido" });
    }

    let desde;
    let hasta;
    let nombreBase = "historial-completo";

    if (completo) {
      desde = undefined;
      hasta = undefined;
    } else {
      ({ desde, hasta } = rangoMes(anio, mes));
      nombreBase = `historial-${anio}-${String(mes).padStart(2, "0")}`;
    }

    const filas = await listarActividad({ desde, hasta, accion });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Panel médico";
    workbook.created = new Date();

    const tipos = [...new Set(filas.map((f) => f.accion))];
    let sufijo = "export";

    // Una sola acción (o filtro) → 1 hoja; varias acciones → una hoja por tipo
    if (tipos.length <= 1) {
      const unica = tipos[0];
      const titulo = unica
        ? ETIQUETAS_ACCION[unica] || unica
        : "Historial";
      agregarHoja(workbook, titulo, filas);
      sufijo = unica || "vacio";
    } else {
      const porAccion = new Map();
      for (const fila of filas) {
        if (!porAccion.has(fila.accion)) porAccion.set(fila.accion, []);
        porAccion.get(fila.accion).push(fila);
      }

      const orden = Object.keys(ETIQUETAS_ACCION);
      const claves = [
        ...orden.filter((k) => porAccion.has(k)),
        ...[...porAccion.keys()].filter((k) => !orden.includes(k)),
      ];

      for (const clave of claves) {
        agregarHoja(
          workbook,
          ETIQUETAS_ACCION[clave] || clave,
          porAccion.get(clave)
        );
      }
      sufijo = "por-accion";
    }

    const nombre = `${nombreBase}-${sufijo}.xlsx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error en exportarHistorialExcel:", error);
    if (!res.headersSent) {
      res.status(500).json({ mensaje: "No se pudo exportar el historial" });
    }
  }
}

module.exports = {
  listarHistorial,
  exportarHistorialExcel,
  ETIQUETAS_ACCION,
};
