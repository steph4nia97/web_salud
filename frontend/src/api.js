const API = "/api";

export async function obtenerDisponibilidad(fecha) {
  const res = await fetch(`${API}/citas/disponibilidad?fecha=${fecha}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar disponibilidad");
  return data;
}

export async function obtenerCalendarioMesPublico(anio, mes) {
  const res = await fetch(
    `${API}/citas/calendario-mes?anio=${anio}&mes=${mes}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el calendario");
  return data;
}

export async function agendarCita(payload) {
  const res = await fetch(`${API}/citas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo agendar la cita");
  return data;
}

export async function iniciarSesion(correo, contraseña) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ correo, contraseña }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "Error al iniciar sesión");
  return data;
}

export async function listarCitas(token, fecha) {
  const url = fecha ? `${API}/citas?fecha=${fecha}` : `${API}/citas`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudieron cargar las citas");
  return data;
}

export async function cambiarEstadoCita(token, id, estado) {
  const res = await fetch(`${API}/citas/${id}/estado`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ estado }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo actualizar");
  return data;
}

export async function obtenerConfigAgenda(token, fecha) {
  const res = await fetch(`${API}/agenda/dia?fecha=${fecha}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar la agenda");
  return data;
}

export async function obtenerMesAgenda(token, anio, mes) {
  const res = await fetch(`${API}/agenda/mes?anio=${anio}&mes=${mes}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el mes");
  return data;
}

export async function configurarDiaAgenda(token, fecha, abierto) {
  const res = await fetch(`${API}/agenda/dia`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fecha, abierto }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo configurar el día");
  return data;
}

export async function configurarHorarioAgenda(
  token,
  fecha,
  hora_inicio,
  hora_fin,
  intervalo
) {
  const res = await fetch(`${API}/agenda/horario`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fecha, hora_inicio, hora_fin, intervalo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo aplicar el horario");
  return data;
}

export async function listarHorariosSemana(token) {
  const res = await fetch(`${API}/agenda/semana`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar la semana");
  return data;
}

export async function configurarHorarioSemana(
  token,
  { dia_semana, abierto, hora_inicio, hora_fin, intervalo }
) {
  const res = await fetch(`${API}/agenda/semana`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      dia_semana,
      abierto,
      hora_inicio,
      hora_fin,
      intervalo,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo guardar el horario semanal");
  return data;
}

export async function configurarAperturaSemana(token, dia_semana, abierto) {
  const res = await fetch(`${API}/agenda/semana/apertura`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ dia_semana, abierto }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.mensaje || "No se pudo actualizar la apertura semanal");
  }
  return data;
}

export async function alternarHoraAgenda(token, fecha, hora, bloqueada) {
  const res = await fetch(`${API}/agenda/hora`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fecha, hora, bloqueada }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo actualizar la hora");
  return data;
}

export async function obtenerBorradorCorreo(token, id, tipo) {
  const res = await fetch(`${API}/citas/${id}/correo?tipo=${tipo}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el borrador");
  return data;
}

export async function enviarCorreoCita(token, id, tipo, mensaje) {
  const res = await fetch(`${API}/citas/${id}/correo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tipo, mensaje }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo enviar el correo");
  return data;
}

export async function cambiarContraseña(token, contraseña_actual, contraseña_nueva) {
  const res = await fetch(`${API}/auth/contrasena`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ contraseña_actual, contraseña_nueva }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cambiar la contraseña");
  return data;
}

export async function obtenerPerfil(token) {
  const res = await fetch(`${API}/auth/perfil`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el perfil");
  return data;
}

export async function actualizarPerfil(
  token,
  { nombre, correo, contraseña_actual, contraseña_nueva }
) {
  const res = await fetch(`${API}/auth/perfil`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre,
      correo,
      contraseña_actual,
      contraseña_nueva,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo actualizar el perfil");
  return data;
}

export async function listarHistorial(token, { anio, mes, accion } = {}) {
  const params = new URLSearchParams();
  if (anio) params.set("anio", String(anio));
  if (mes) params.set("mes", String(mes));
  if (accion) params.set("accion", accion);
  const qs = params.toString();
  const res = await fetch(`${API}/historial${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar el historial");
  return data;
}

export async function exportarHistorialExcel(
  token,
  anio,
  mes,
  { accion = "", completo = false } = {}
) {
  const params = new URLSearchParams();
  if (completo) {
    params.set("completo", "1");
  } else {
    params.set("anio", String(anio));
    params.set("mes", String(mes));
  }
  if (accion) params.set("accion", accion);

  const res = await fetch(`${API}/historial/exportar?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensaje || "No se pudo exportar");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = completo
    ? `historial-completo.xlsx`
    : `historial-${anio}-${String(mes).padStart(2, "0")}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
