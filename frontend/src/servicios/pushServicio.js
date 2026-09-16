import { pedirJson } from './api';

function urlBase64AUnit8Array(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64ConRelleno = (base64 + relleno).replace(/-/g, '+').replace(/_/g, '/');
  const texto = decodeURIComponent(escape(atob(base64ConRelleno)));
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) {
    bytes[i] = texto.charCodeAt(i);
  }
  return bytes;
}

function bufferABase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binario = '';
  for (const byte of bytes) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export const pushServicio = {
  compatible() {
    return (
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  async listo() {
    if (!pushServicio.compatible()) return null;
    await navigator.serviceWorker.register('/sw.js');
    return navigator.serviceWorker.ready;
  },

  async claveVapid() {
    const datos = await pedirJson('/clave_vapid');
    return datos.clave_vapid;
  },

  async estado() {
    if (!pushServicio.compatible()) return 'no-soportado';
    const registro = await pushServicio.listo();
    const suscripcion = await registro.pushManager.getSubscription();
    return suscripcion ? 'suscrito' : 'no-suscrito';
  },

  async suscribir(token) {
    const registro = await pushServicio.listo();
    let suscripcion = await registro.pushManager.getSubscription();
    if (!suscripcion) {
      const clave = await pushServicio.claveVapid();
      suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64AUnit8Array(clave),
      });
    }

    const clave_publica = suscripcion.getKey('p256dh') ? bufferABase64Url(suscripcion.getKey('p256dh')) : '';
    const autenticacion = suscripcion.getKey('auth') ? bufferABase64Url(suscripcion.getKey('auth')) : '';

    await pedirJson('/suscripcion_push', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ endpoint: suscripcion.endpoint, clave_publica, autenticacion }),
    });

    return suscripcion.endpoint;
  },

  async desuscribir(token) {
    if (!pushServicio.compatible()) return;
    const registro = await navigator.serviceWorker.ready;
    const suscripcion = await registro.pushManager.getSubscription();
    if (!suscripcion) return;

    if (token) {
      try {
        await pedirJson('/suscripcion_push', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint: suscripcion.endpoint }),
        });
      } catch {
        // la baja remota es best-effort
      }
    }
    await suscripcion.unsubscribe();
  },
};