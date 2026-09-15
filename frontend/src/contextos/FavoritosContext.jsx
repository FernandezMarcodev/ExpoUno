import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { favoritoServicio } from '../servicios/favoritoServicio';

const FavoritosContext = createContext(null);

export function FavoritosProvider({ children }) {
  const { autenticado, token } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!autenticado || !token) {
      setFavoritos([]);
      return;
    }
    let activo = true;
    setCargando(true);
    favoritoServicio
      .obtenerFavoritos(token)
      .then((datos) => { if (activo) setFavoritos(datos); })
      .catch(() => { if (activo) setFavoritos([]); })
      .finally(() => { if (activo) setCargando(false); });

    return () => { activo = false; };
  }, [autenticado, token]);

  const valor = useMemo(() => {
    const ids = new Set(favoritos.map((c) => c.id));

    async function alternarFavorito(concierto) {
      if (!autenticado || !token) return false;
      const esFavorito = ids.has(concierto.id);
      if (esFavorito) {
        await favoritoServicio.quitarFavorito(concierto.id, token);
        setFavoritos((previo) => previo.filter((c) => c.id !== concierto.id));
      } else {
        await favoritoServicio.agregarFavorito(concierto.id, token);
        setFavoritos((previo) => [concierto, ...previo]);
      }
      return true;
    }

    return {
      favoritos,
      cargando,
      esFavorito: (id) => ids.has(id),
      alternarFavorito,
    };
  }, [favoritos, autenticado, token, cargando]);

  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error('useFavoritos debe usarse dentro de <FavoritosProvider>');
  }
  return contexto;
}