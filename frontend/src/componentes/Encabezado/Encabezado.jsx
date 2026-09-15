import styles from "./encabezado.module.css";
import { useState, useEffect, useRef } from "react";
import { FaSun, FaMoon, FaSignOutAlt, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import { useNovedades } from "../../contextos/NovedadesContext";

function Encabezado() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const { usuario, autenticado, cerrarSesion } = useAuth();
  const { notificaciones, noLeidas, marcarLeida, marcarTodas } = useNovedades();
  const [campanaAbierta, setCampanaAbierta] = useState(false);
  const campanaRef = useRef(null);

  useEffect(() => {
    const temaGuardado = localStorage.getItem("tema");
    if (temaGuardado === "oscuro") {
      setModoOscuro(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const alClicFuera = (evento) => {
      if (campanaRef.current && !campanaRef.current.contains(evento.target)) {
        setCampanaAbierta(false);
      }
    };
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, []);

  function cambiarTema() {
    if (modoOscuro) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tema", "claro");
      setModoOscuro(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tema", "oscuro");
      setModoOscuro(true);
    }
  }

  function cerrar() {
    cerrarSesion();
  }

  return (
    <header className={styles.encabezado}>
      <Link to="/" className={styles.marca}>
        <img src="/logo.png" alt="" className={styles.logoMarca} aria-hidden="true" />
        <h1 className={styles.tituloMarca}>Concierto Finder</h1>
      </Link>

      <div className={styles.acciones}>
        {autenticado && (
          <Link to="/favoritos" className={styles.enlaceSecundario}>
            Favoritos
          </Link>
        )}
        {autenticado && (
          <div className={styles.campanaWrapper} ref={campanaRef}>
            <button
              className={styles.temaToggle}
              onClick={() => setCampanaAbierta((abierta) => !abierta)}
              aria-label="Novedades de artistas seguidos"
              title="Novedades de artistas seguidos"
            >
              <FaBell className={styles.iconoTema} />
              {noLeidas > 0 && (
                <span className={styles.contadorCampana}>{noLeidas}</span>
              )}
            </button>

            {campanaAbierta && (
              <div className={styles.panelCampana}>
                <div className={styles.tituloCampana}>
                  <span>Novedades</span>
                  {noLeidas > 0 && (
                    <button className={styles.enlaceAccionCampana} onClick={marcarTodas}>
                      Marcar todas
                    </button>
                  )}
                </div>
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
                            setCampanaAbierta(false);
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
        )}
        {autenticado ? (
          <span className={styles.usuario}>{usuario?.nombre}</span>
        ) : (
          <Link to="/login" className={styles.enlaceAccion}>
            Iniciar sesión
          </Link>
        )}
        <button
          className={styles.temaToggle}
          onClick={cambiarTema}
          aria-label={modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {modoOscuro ? (
            <FaSun className={styles.iconoTema} />
          ) : (
            <FaMoon className={styles.iconoTema} />
          )}
        </button>
        {autenticado && (
          <button
            className={styles.temaToggle}
            onClick={cerrar}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <FaSignOutAlt className={styles.iconoTema} />
          </button>
        )}
      </div>
    </header>
  );
}

export default Encabezado;