import styles from "./encabezado.module.css";
import { useState, useEffect } from "react";
import IconoContraste from "../Iconos/Contraste";

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
    console.log('toggle tema, antes:', modoOscuro)
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
      <h1>Conciertos Finder</h1>
      <button 
      className={styles.botonIcono} 
      onClick={cambiarTema}
      aria-label={modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={modoOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      >
        <IconoContraste className={styles.iconoContraste} />
      </button>
    </header>
  );
}

export default Encabezado;
