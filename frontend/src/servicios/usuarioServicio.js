import { pedirJson } from './api';

const TOKEN_KEY = 'expouno_token';
const USUARIO_KEY = 'expouno_usuario';

export const usuarioServicio = {
  guardarToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  guardarUsuario(usuario) {
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
  },

  obtenerUsuario() {
    try {
      const raw = localStorage.getItem(USUARIO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  limpiarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  },

  autenticado() {
    return Boolean(usuarioServicio.obtenerToken());
  },

  async registrar(datos) {
    const resultado = await pedirJson('/registro', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    usuarioServicio.guardarToken(resultado.token);
    usuarioServicio.guardarUsuario(resultado.usuario);
    return resultado;
  },

  async iniciarSesion(datos) {
    const resultado = await pedirJson('/login', {
      method: 'POST',
      body: JSON.stringify(datos),
    });
    usuarioServicio.guardarToken(resultado.token);
    usuarioServicio.guardarUsuario(resultado.usuario);
    return resultado;
  },

  async obtenerPerfil(token) {
    return pedirJson('/me', {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : { Authorization: `Bearer ${usuarioServicio.obtenerToken()}` },
    });
  },

  cerrarSesion() {
    usuarioServicio.limpiarSesion();
  },
};