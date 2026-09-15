import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usuarioServicio } from '../servicios/usuarioServicio';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => usuarioServicio.obtenerUsuario());
  const [cargando, setCargando] = useState(Boolean(usuarioServicio.obtenerToken()));

  useEffect(() => {
    let activo = true;
    if (!usuarioServicio.autenticado()) {
      setCargando(false);
      return;
    }

    usuarioServicio
      .obtenerPerfil()
      .then((resultado) => {
        if (activo) {
          setUsuario(resultado.usuario);
          usuarioServicio.guardarUsuario(resultado.usuario);
        }
      })
      .catch(() => {
        if (activo) {
          usuarioServicio.limpiarSesion();
          setUsuario(null);
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, []);

  const valor = useMemo(() => ({
    usuario,
    cargando,
    autenticado: Boolean(usuario),
    token: usuarioServicio.obtenerToken(),

    async iniciarSesion(datos) {
      const resultado = await usuarioServicio.iniciarSesion(datos);
      setUsuario(resultado.usuario);
      return resultado;
    },

    async registrarse(datos) {
      const resultado = await usuarioServicio.registrar(datos);
      setUsuario(resultado.usuario);
      return resultado;
    },

    cerrarSesion() {
      usuarioServicio.cerrarSesion();
      setUsuario(null);
    },

    setUsuario,
  }), [usuario, cargando]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return contexto;
}