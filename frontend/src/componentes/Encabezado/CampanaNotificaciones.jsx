import { useEffect, useState, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { useAuth } from '../../contextos/AuthContext';
import { useNovedades } from '../../contextos/NovedadesContext';
import { pushServicio } from '../../servicios/pushServicio';
import styles from './encabezado.module.css';

const CampanaNotificaciones = () => {
  const { token } = useAuth();
  const { notificaciones, noLeidas, marcarLeida, marcarTodas } = useNovedades();
  const [abierta, setAbierta] = useState(false);
  const [soportado, setSoportado] = useState(false);
  const [pushActivadas, setPushActivadas] = useState(false);
  const [cargandoPush, setCargandoPush] = useState(false);
  const campanaRef = useRef(null);

  useEffect(() => {
    const alClicFuera = (evento) => {
      if (campanaRef.current && !campanaRef.current.contains(evento.target)) {
        setAbierta(false);
      }
    };
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    pushServicio
      .estado()
      .then((estado) => {
        if (!activo) return;
        setSoportado(estado !== 'no-soportado');
        setPushActivadas(estado === 'suscrito');
      })
      .catch(() => {});
    return () => { activo = false; };
  }, [token]);

  async function alternarPush() {
    setCargandoPush(true);
    try {
      if (!pushActivadas) {
        const permiso = await Notification.requestPermission();
        if (permiso !== 'granted') return;
        await pushServicio.suscribir(token);
        setPushActivadas(true);
      } else {
        setPushActivadas(false);
        await pushServicio.desuscribir(token);
      }
    } catch (error) {
      console.error('Error al gestionar notificaciones push:', error);
    } finally {
      setCargandoPush(false);
    }
  }

  return (
    <div className={styles.campanaWrapper} ref={campanaRef}>
      <button
        className={styles.temaToggle}
        onClick={() => setAbierta((abierta) => !abierta)}
        aria-label="Novedades y notificaciones"
        title="Novedades y notificaciones"
      >
        <FaBell className={styles.iconoTema} />
        {noLeidas > 0 && (
          <span className={styles.contadorCampana}>{noLeidas}</span>
        )}
      </button>

      {abierta && (
        <div className={styles.panelCampana}>
          <div className={styles.tituloCampana}>
            <span>Novedades</span>
            {noLeidas > 0 && (
              <button className={styles.enlaceAccionCampana} onClick={marcarTodas}>
                Marcar todas
              </button>
            )}
          </div>

          {soportado && (
            <div className={styles.filaPush}>
              <span className={styles.estadoPush}>
                {pushActivadas ? 'Notificaciones activadas' : 'Notificaciones desactivadas'}
              </span>
              <button
                className={`${styles.botonPush} ${pushActivadas ? styles.botonPushActivo : ""}`}
                onClick={alternarPush}
                disabled={cargandoPush}
              >
                {cargandoPush
                  ? '…'
                  : pushActivadas
                    ? 'Desactivar'
                    : 'Activar'}
              </button>
            </div>
          )}

          {notificaciones.length === 0 ? (
            <p className={styles.vacioCampana}>
              Aún no hay novedades de tus artistas.
            </p>
          ) : (
            <ul className={styles.listaCampana}>
              {notificaciones.slice(0, 20).map((notificacion) => (
                <li key={notificacion.id}>
                  <button
                    className={`${styles.itemCampana} ${notificacion.leida ? styles.itemCampanaLeido : ""}`}
                    onClick={() => {
                      marcarLeida(notificacion);
                      setAbierta(false);
                    }}
                  >
                    <span className={styles.artistaCampana}>
                      {notificacion.concierto?.artista}
                    </span>
                    <span className={styles.nombreCampana}>
                      {notificacion.concierto?.nombre}
                    </span>
                    <span className={styles.fechaCampana}>
                      {notificacion.concierto?.fecha || ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CampanaNotificaciones;