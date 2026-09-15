import { pedirJson } from './api';

export const favoritoServicio = {
  async obtenerFavoritos(token) {
    const datos = await pedirJson('/favoritos', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return datos.favoritos || [];
  },

  async agregarFavorito(conciertoId, token) {
    return pedirJson(`/favoritos/${conciertoId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  async quitarFavorito(conciertoId, token) {
    return pedirJson(`/favoritos/${conciertoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};