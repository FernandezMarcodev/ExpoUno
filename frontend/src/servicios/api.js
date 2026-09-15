const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://expouno-back.onrender.com';

async function pedirJson(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });

  let datos = null;
  const texto = await respuesta.text();
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const error = new Error(datos?.error || `Error HTTP ${respuesta.status}`);
    error.status = respuesta.status;
    error.datos = datos;
    throw error;
  }

  return datos;
}

export { API_BASE_URL, pedirJson };