# Web Salud — Dr. Fabiar Arce Tamblay

Página web de traumatología y ortopedia con biografía y agendamiento de horas en línea.

## Estructura

```
backend/    API Express (puerto 4000)
frontend/   Sitio React + Vite (puerto 5173)
```

## Cómo correrlo

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run seed
npm run dev
```

Credenciales demo:
- correo: `medico@consulta.local`
- contraseña: `medico123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173

- Sitio público: biografía + formulario de agenda
- Panel médico: http://localhost:5173/#/admin

## API (resumen)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login médico/admin |
| GET | `/api/citas/disponibilidad?fecha=YYYY-MM-DD` | No | Horarios libres |
| POST | `/api/citas` | No | Agendar cita (público) |
| GET | `/api/citas` | JWT | Listar citas |
| PATCH | `/api/citas/:id/estado` | JWT | Confirmar/cancelar |
