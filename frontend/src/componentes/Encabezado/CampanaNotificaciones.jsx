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
  const [permiso, setPermiso] = useState(null);
  const [pushActivadas, setPushActivadas] = useState(false);
  const [cargandoPush, setCargandoPush] = useState(false);
  const [errorPush, setErrorPush] = useState(null);
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
        if (typeof Notification !== 'undefined') {
          setPermiso(Notification.permission || null);
        }
      })
      .catch(() => {});
    return () => { activo = false; };
  }, [token, abierta]);

  async function sincronizarEstado() {
    try {
      const estado = await pushServicio.estado();
      setSoportado(estado !== 'no-soportado');
      setPushActivadas(estado === 'suscrito');
      if (typeof Notification !== 'undefined') {
        setPermiso(Notification.permission || null);
      }
    } catch {
      setSoportado(false);
    }
  }

  async function alternarPush() {
    setCargandoPush(true);
    setErrorPush(null);
    try {
      if (!pushActivadas) {
        const resultado = await Notification.requestPermission();
        setPermiso(resultado);
        if (resultado !== 'granted') {
          setErrorPush(
            resultado === 'denied'
              ? 'Las notificaciones están bloqueadas en este navegador. Habilitá el permiso en la configuración del sitio (ícono de candado en la barra de direcciones) y volvé a intentar.'
              : 'Tocá «Permitir» en el aviso del navegador para activar las notificaciones.'
          );
          return;
        }
        await pushServicio.suscribir(token);
        await sincronizarEstado();
      } else {
        setPushActivadas(false);
        await pushServicio.desuscribir(token);
        await sincronizarEstado();
      }
    } catch (error) {
      console.error('Error al gestionar notificaciones push:', error);
      const detalle = error instanceof Error ? error.message : String(error);
      if (error?.status === 401) {
        setErrorPush('Tu sesión expiró. Volvé a iniciar sesión para activar las notificaciones.');
      } else {
        setErrorPush(
          `No se pudieron activar las notificaciones: ${detalle}. Revisá el permiso de notificaciones del navegador para este sitio e intentá de nuevo.`
        );
      }
      await sincronizarEstado();
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

          {soportado ? (
            <div className={styles.filaPush}>
              <span className={styles.estadoPush}>
                {cargandoPush
                  ? 'Actualizando…'
                  : pushActivadas
                    ? 'Notificaciones activadas'
                    : 'Notificaciones desactivadas'}
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
          ) : (
            <p className={styles.avisoPush}>
              Tu navegador no permite notificaciones push.
            </p>
          )}

          {errorPush && <p className={styles.errorPush}>{errorPush}</p>}
          {!errorPush && permiso === 'denied' && (
            <p className={styles.errorPush}>
              Las notificaciones están bloqueadas en este navegador. Habilitá el permiso en la configuración del sitio (ícono de candado en la barra de direcciones) y entrá de nuevo a la pestaña.
            </p>
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