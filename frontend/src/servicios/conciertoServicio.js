console.log('Cargando conciertoServicio.js - versión fetch para conciertos');

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://back-conciertos.onrender.com';
console.log('API_BASE_URL configurada:', API_BASE_URL);

export const conciertoServicio = {
  async obtenerConciertos() {

    try {
      console.log('Fetch a:', `${API_BASE_URL}/conciertos`);
      const response = await fetch(`${API_BASE_URL}/conciertos`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const conciertosArray = Array.isArray(data?.conciertos) ? data.conciertos : [];
      console.log('Conciertos obtenidos:', conciertosArray.length);

      return conciertosArray;
    } catch (error) {
      console.error('Error en la petición:', error);
      return [];
    }
  },

  async obtenerConciertosCerca(lat, lng, radio = 5) {
    try {
      const url = `${API_BASE_URL}/conciertos_cerca?lng=${lng}&lat=${lat}&km=${radio}`;
      console.log('Fetch a:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const conciertosArray = Array.isArray(data?.conciertos) ? data.conciertos : [];
      console.log('Conciertos cercanos obtenidos:', conciertosArray.length);

      return conciertosArray;
    } catch (error) {
      console.error('Error en obtenerConciertosCerca:', error);
      return [];
    }
  }
};
