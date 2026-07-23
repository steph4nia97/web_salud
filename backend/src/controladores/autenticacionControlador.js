const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  crearUsuario,
  buscarUsuarioPorCorreo,
  buscarUsuarioAuthPorId,
  actualizarContraseña,
  actualizarPerfil,
  buscarUsuarioPorId,
} = require("../modelos/usuarioModelo");
const { registrarActividad } = require("../modelos/actividadModelo");
const { registrarDesdeReq } = require("../servicios/actividadServicio");
const bd = require("../config/basedatos");

const CLAVE_JWT = process.env.CLAVE_JWT;

function actualizarNombreEnLogs(nombreAnterior, nombreNuevo) {
  return new Promise((resolver, rechazar) => {
    if (!nombreAnterior || nombreAnterior === nombreNuevo) {
      return resolver(0);
    }
    bd.run(
      `UPDATE actividad_log SET usuario_nombre = ? WHERE usuario_nombre = ?`,
      [nombreNuevo, nombreAnterior],
      function (error) {
        if (error) return rechazar(error);
        resolver(this.changes);
      }
    );
  });
}

async function registrarUsuario(req, res) {
  try {
    const { nombre, correo, contraseña, contrasena, rol } = req.body;
    const contraseñaPlano = contraseña || contrasena;

    if (!nombre || !correo || !contraseñaPlano || !rol) {
      return res.status(400).json({ mensaje: "Faltan datos" });
    }

    if (!["medico", "admin"].includes(rol)) {
      return res.status(400).json({ mensaje: "Rol inválido" });
    }

    const usuarioExistente = await buscarUsuarioPorCorreo(correo);
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: "El correo ya está registrado" });
    }

    const contraseñaHash = await bcrypt.hash(contraseñaPlano, 10);
    const nuevoUsuario = await crearUsuario({
      nombre,
      correo,
      contraseñaHash,
      rol,
    });

    res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario: nuevoUsuario,
    });
  } catch (error) {
    console.error("Error en registrarUsuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function iniciarSesion(req, res) {
  try {
    const { correo, contraseña, contrasena } = req.body;
    const contraseñaPlano = contraseña || contrasena;

    if (!correo || !contraseñaPlano) {
      return res
        .status(400)
        .json({ mensaje: "Debes enviar correo y contraseña" });
    }

    const usuario = await buscarUsuarioPorCorreo(correo);
    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const contraseñaCorrecta = await bcrypt.compare(
      contraseñaPlano,
      usuario.contraseña_hash
    );

    if (!contraseñaCorrecta) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    if (!CLAVE_JWT) {
      return res.status(500).json({ mensaje: "Error de configuración JWT" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
      CLAVE_JWT,
      { expiresIn: "8h" }
    );

    try {
      await registrarActividad({
        usuarioId: usuario.id,
        usuarioNombre: usuario.nombre,
        accion: "login",
        detalle: `${usuario.nombre} inició sesión en el panel`,
      });
    } catch (logError) {
      console.error("No se pudo registrar login:", logError.message);
    }

    res.json({
      mensaje: "Inicio de sesión exitoso",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en iniciarSesion:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function obtenerPerfil(req, res) {
  try {
    const usuario = await buscarUsuarioPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }
    res.json({ usuario });
  } catch (error) {
    console.error("Error en obtenerPerfil:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function actualizarPerfilUsuario(req, res) {
  try {
    const {
      nombre,
      correo,
      contraseña_actual,
      contraseña_nueva,
      contrasena_actual,
      contrasena_nueva,
    } = req.body;

    const actual = contraseña_actual || contrasena_actual || "";
    const nueva = contraseña_nueva || contrasena_nueva || "";

    const nombreTrim = typeof nombre === "string" ? nombre.trim() : "";
    const correoTrim =
      typeof correo === "string" ? correo.trim().toLowerCase() : "";

    if (!nombreTrim || !correoTrim) {
      return res.status(400).json({
        mensaje: "Debes enviar nombre y correo",
      });
    }

    if (!actual) {
      return res.status(400).json({
        mensaje: "Debes confirmar con tu contraseña actual",
      });
    }

    if (nueva && String(nueva).length < 6) {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const usuario = await buscarUsuarioAuthPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const ok = await bcrypt.compare(actual, usuario.contraseña_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ mensaje: "La contraseña actual no es correcta" });
    }

    if (correoTrim !== usuario.correo) {
      const otro = await buscarUsuarioPorCorreo(correoTrim);
      if (otro && otro.id !== usuario.id) {
        return res
          .status(409)
          .json({ mensaje: "Ese correo ya está en uso por otra cuenta" });
      }
    }

    const cambios = [];
    const payload = {
      nombre: nombreTrim,
      correo: correoTrim,
    };

    if (nueva) {
      payload.contraseñaHash = await bcrypt.hash(nueva, 10);
      cambios.push("contraseña");
    }
    if (nombreTrim !== usuario.nombre) cambios.push("nombre");
    if (correoTrim !== usuario.correo) cambios.push("correo");

    if (!cambios.length) {
      return res.json({
        mensaje: "No hubo cambios que guardar",
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    }

    await actualizarPerfil(usuario.id, payload);

    if (nombreTrim !== usuario.nombre) {
      await actualizarNombreEnLogs(usuario.nombre, nombreTrim);
    }

    await registrarDesdeReq(
      {
        ...req,
        usuario: { ...req.usuario, nombre: nombreTrim },
      },
      "editar_perfil",
      `Perfil actualizado (${cambios.join(", ")})`
    );

    const actualizado = await buscarUsuarioPorId(usuario.id);
    res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: actualizado,
    });
  } catch (error) {
    console.error("Error en actualizarPerfilUsuario:", error);
    if (error && error.code === "SQLITE_CONSTRAINT") {
      return res
        .status(409)
        .json({ mensaje: "Ese correo ya está en uso por otra cuenta" });
    }
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

async function cambiarContraseña(req, res) {
  try {
    const {
      contraseña_actual,
      contraseña_nueva,
      contrasena_actual,
      contrasena_nueva,
    } = req.body;
    const actual = contraseña_actual || contrasena_actual;
    const nueva = contraseña_nueva || contrasena_nueva;

    if (!actual || !nueva) {
      return res.status(400).json({
        mensaje: "Debes enviar la contraseña actual y la nueva",
      });
    }

    if (String(nueva).length < 6) {
      return res.status(400).json({
        mensaje: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const usuario = await buscarUsuarioAuthPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const ok = await bcrypt.compare(actual, usuario.contraseña_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ mensaje: "La contraseña actual no es correcta" });
    }

    const hash = await bcrypt.hash(nueva, 10);
    await actualizarContraseña(usuario.id, hash);
    await registrarDesdeReq(
      req,
      "cambio_contraseña",
      "Se actualizó la contraseña de acceso"
    );

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error en cambiarContraseña:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
}

module.exports = {
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  actualizarPerfilUsuario,
  cambiarContraseña,
};
