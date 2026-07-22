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
