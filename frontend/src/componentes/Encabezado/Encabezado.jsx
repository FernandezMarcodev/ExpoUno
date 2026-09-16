import styles from "./encabezado.module.css";
import { useState, useEffect } from "react";
import { FaSun, FaMoon, FaSignOutAlt, FaQuestionCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import CampanaNotificaciones from "./CampanaNotificaciones";

function Encabezado() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const { usuario, autenticado, cerrarSesion } = useAuth();

  useEffect(() => {
    const temaGuardado = localStorage.getItem("tema");
    if (temaGuardado === "oscuro") {
      setModoOscuro(true);
      document.documentElement.classList.add("dark");
    }
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
        <h1 className={styles.tituloMarca}>Concierto Finder</h1>
      </Link>

      <div className={styles.acciones}>
        {autenticado && <CampanaNotificaciones />}
        {autenticado ? (
          <span className={styles.usuario}>{usuario?.nombre}</span>
        ) : (
          <div className={styles.botonesAuth}>
            <Link to="/login" className={styles.enlaceSecundario}>
              Iniciar sesión
            </Link>
            <Link to="/registro" className={styles.enlaceAccion}>
              Crear cuenta
            </Link>
          </div>
        )}
        <Link
          to="/manual"
          className={styles.temaToggle}
          aria-label="Cómo usar la página"
          title="Cómo usar la página"
        >
          <FaQuestionCircle className={styles.iconoTema} />
        </Link>
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