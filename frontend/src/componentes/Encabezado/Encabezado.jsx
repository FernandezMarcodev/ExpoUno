import styles from "./encabezado.module.css";
import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

function Encabezado() {
  const [modoOscuro, setModoOscuro] = useState(false);

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

  return (
    <header className={styles.encabezado}>
      <div className={styles.marca}>
        <img src="/logo.png" alt="" className={styles.logoMarca} aria-hidden="true" />
        <h1 className={styles.tituloMarca}>Concierto Finder</h1>
      </div>
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
    </header>
  );
}

export default Encabezado;
