const API = "/api";

export async function obtenerDisponibilidad(fecha) {
  const res = await fetch(`${API}/citas/disponibilidad?fecha=${fecha}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || "No se pudo cargar disponibilidad");
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
