import styles from "./encabezado.module.css";
import { useState, useEffect } from "react";
import { FaSun, FaMoon, FaSignOutAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";

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
        <img src="/logo.png" alt="" className={styles.logoMarca} aria-hidden="true" />
        <h1 className={styles.tituloMarca}>Concierto Finder</h1>
      </Link>

      <div className={styles.acciones}>
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