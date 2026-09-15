import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { seguidoServicio } from '../servicios/seguidoServicio';

const SeguidosContext = createContext(null);

function normalizar(artista) {
  return (artista || '').trim().toLowerCase();
}

export function SeguidosProvider({ children }) {
  const { autenticado, token } = useAuth();
  const [seguidos, setSeguidos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!autenticado || !token) {
      setSeguidos([]);
      return;
    }
    let activo = true;
    setCargando(true);
    seguidoServicio
      .obtenerSeguidos(token)
      .then((datos) => { if (activo) setSeguidos(datos); })
      .catch(() => { if (activo) setSeguidos([]); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [autenticado, token]);

  const valor = useMemo(() => {
    const normalizados = new Set(seguidos.map((a) => normalizar(a)));

    async function alternarSeguido(artista) {
      if (!autenticado || !token) return false;
      const nombre = normalizar(artista);
      if (normalizados.has(nombre)) {
        await seguidoServicio.quitarSeguido(artista, token);
        setSeguidos((previo) => previo.filter((a) => normalizar(a) !== nombre));
      } else {
        await seguidoServicio.agregarSeguido(artista, token);
        setSeguidos((previo) => [nombre, ...previo.filter((a) => normalizar(a) !== nombre)]);
      }
      return true;
    }

    return {
      seguidos,
      cargando,
      esSeguido: (artista) => normalizados.has(normalizar(artista)),
      alternarSeguido,
      setSeguidos,
    };
  }, [seguidos, autenticado, token, cargando]);

  return <SeguidosContext.Provider value={valor}>{children}</SeguidosContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSeguidos() {
  const contexto = useContext(SeguidosContext);
  if (!contexto) {
    throw new Error('useSeguidos debe usarse dentro de <SeguidosProvider>');
  }
  return contexto;
}