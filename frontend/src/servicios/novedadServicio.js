import { pedirJson } from './api';

export const novedadServicio = {
  async obtenerNovedades(token) {
    return pedirJson('/novedades', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async marcarLeida(notificacionId, token) {
    return pedirJson(`/novedades/${notificacionId}/leida`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async marcarTodasLeidas(token) {
    return pedirJson('/novedades/leer_todas', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};