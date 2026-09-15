import { useEffect, useState } from 'react';
import { FaBell, FaBellSlash } from 'react-icons/fa';
import { useAuth } from '../../contextos/AuthContext';
import { pushServicio } from '../../servicios/pushServicio';
import styles from './encabezado.module.css';

const TogglePush = () => {
  const { token } = useAuth();
  const [activadas, setActivadas] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    pushServicio
      .estado()
      .then((estado) => {
        if (!activo) return;
        setSoportado(estado !== 'no-soportado');
        setActivadas(estado === 'suscrito');
      })
      .catch(() => {});
    return () => { activo = false; };
  }, [token]);

  async function alternar() {
    setCargando(true);
    try {
      if (!activadas) {
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') return;
        await pushServicio.suscribir(token);
        setActivadas(true);
      } else {
        setActivadas(false);
        await pushServicio.desuscribir(token);
      }
    } catch (error) {
      console.error('Error al gestionar notificaciones push:', error);
    } finally {
      setCargando(false);
    }
  }

  if (!soportado || !token) return null;

  return (
    <button
      className={`${styles.temaToggle} ${activadas ? styles.pushActivo : ""}`}
      onClick={alternar}
      disabled={cargando}
      aria-label={activadas ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
      title={activadas ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
    >
      {activadas ? (
        <FaBell className={styles.iconoTema} />
      ) : (
        <FaBellSlash className={styles.iconoTema} />
      )}
    </button>
  );
};

export default TogglePush;