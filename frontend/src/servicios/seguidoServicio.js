import { pedirJson } from './api';

export const seguidoServicio = {
  async obtenerSeguidos(token) {
    const datos = await pedirJson('/seguidos', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return datos.seguidos || [];
  },

  async agregarSeguido(artista, token) {
    return pedirJson('/seguidos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ artista }),
    });
  },

  async quitarSeguido(artista, token) {
    return pedirJson(`/seguidos/${encodeURIComponent(artista)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};