import React from "react";
import styles from "./estadoVacio.module.css";

const EstadoVacio = ({ tipo = "sin-resultados" }) => {
  // Configuración de mensajes según el tipo
  const configs = {
    "sin-resultados": {
      titulo: "No hay conciertos",
      descripcion:
        "No se encontraron conciertos con los filtros seleccionados. Intenta ajustar tu búsqueda.",
    },
    error: {
      titulo: "Error al cargar",
      descripcion:
        "Hubo un problema al cargar los conciertos. Por favor, intenta nuevamente.",
    },
  };

  // Elegimos la configuración según el tipo
  const config = configs[tipo] || configs["sin-resultados"];

  return (
    <div className={styles.estadoVacio}>
      <h3>{config.titulo}</h3>
      <p>{config.descripcion}</p>
      {tipo === "error" && (
        <button onClick={() => window.location.reload()}>Reintentar</button>
      )}
    </div>
  );
};

export default EstadoVacio;
