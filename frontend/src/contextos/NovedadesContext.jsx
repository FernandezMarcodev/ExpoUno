import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { novedadServicio } from '../servicios/novedadServicio';

const NovedadesContext = createContext(null);

export function NovedadesProvider({ children }) {
  const { autenticado, token } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);

  const refrescar = useCallback(async () => {
    if (!autenticado || !token) {
      setNotificaciones([]);
      setNoLeidas(0);
      return;
    }
    try {
      setCargando(true);
      const datos = await novedadServicio.obtenerNovedades(token);
      setNotificaciones(datos.notificaciones || []);
      setNoLeidas(datos.no_leidas || 0);
    } catch {
      setNotificaciones([]);
      setNoLeidas(0);
    } finally {
      setCargando(false);
    }
  }, [autenticado, token]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const valor = useMemo(() => ({
    notificaciones,
    noLeidas,
    cargando,

    refrescar,

    async marcarLeida(notificacion) {
      if (!token) return;
      try {
        await novedadServicio.marcarLeida(notificacion.id, token);
      } catch {
        return;
      }
      setNotificaciones((previo) =>
        previo.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n))
      );
      setNoLeidas((n) => Math.max(0, n - 1));
    },

    async marcarTodas() {
      if (!token) return;
      try {
        await novedadServicio.marcarTodasLeidas(token);
      } catch {
        return;
      }
      setNotificaciones((previo) => previo.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    },
  }), [notificaciones, noLeidas, cargando, token, refrescar]);

  return <NovedadesContext.Provider value={valor}>{children}</NovedadesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNovedades() {
  const contexto = useContext(NovedadesContext);
  if (!contexto) {
    throw new Error('useNovedades debe usarse dentro de <NovedadesProvider>');
  }
  return contexto;
}