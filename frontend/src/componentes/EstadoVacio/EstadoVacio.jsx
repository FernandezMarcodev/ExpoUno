import React from "react";
import styles from "./estadoVacio.module.css";
import { FaSearch, FaExclamationTriangle } from "react-icons/fa";

const EstadoVacio = ({ tipo = "sin-resultados", titulo, descripcion, onReiniciar }) => {
  const configs = {
    "sin-resultados": {
      titulo: "No hay conciertos",
      descripcion:
        "No se encontraron conciertos con los filtros seleccionados. Intenta ajustar tu busqueda.",
      icono: <FaSearch className={styles.iconoEstado} />,
    },
    error: {
      titulo: "Error al cargar",
      descripcion:
        "Hubo un problema al cargar los conciertos. Por favor, intenta nuevamente.",
      icono: <FaExclamationTriangle className={styles.iconoEstado} />,
    },
  };

  const config = configs[tipo] || configs["sin-resultados"];

  return (
    <div className={styles.estadoVacio}>
      <div className={styles.iconoWrapper}>
        {config.icono}
      </div>
      <h3 className={styles.titulo}>{titulo || config.titulo}</h3>
      <p className={styles.descripcion}>
        {descripcion !== undefined ? descripcion : config.descripcion}
      </p>
      {(tipo === "error" || onReiniciar) && (
        <button
          className={styles.botonReintentar}
          onClick={() => (onReiniciar ? onReiniciar() : window.location.reload())}
        >
          {tipo === "error" ? "Reintentar" : "Limpiar filtros"}
        </button>
      )}
    </div>
  );
};

export default EstadoVacio;