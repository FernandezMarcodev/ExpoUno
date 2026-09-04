import styles from "./tarjetaConcierto.module.css";
import React from "react";

const TarjetaConcierto = ({ concierto, seleccionado, onVerEnMapa }) => {
  return (
    <div className={`${styles.tarjeta} ${seleccionado ? styles['tarjeta-seleccionada'] : ""}`}>
      
      {/* Nombre del concierto y estado */}
      <div className={styles['cabecera-tarjeta']}>
        <h3 className={styles['nombre-concierto']}>{concierto.nombre}</h3>
        {concierto.isAgotado ? (
          <span className={styles['estado-agotado']}>Agotado</span>
        ) : (
          <span className={styles['estado-disponible']}>Disponible</span>
        )}
      </div>

      {/* Información del concierto */}
      <div className={styles['info-concierto']}>
        <div><strong>Artista:</strong> {concierto.artista}</div>
        <div><strong>Lugar:</strong> {concierto.ubicacion_detalle?.nombre}</div>
        <div><strong>Fecha:</strong> {new Date(concierto.fecha).toLocaleDateString('es-AR')}</div>
        {concierto.hora && <div><strong>Hora:</strong> {concierto.hora.substring(0,5)}</div>}
        {concierto.isAptoMenores && <div className={styles['apto-menores']}>Apto para menores</div>}
      </div>

      {/* Botones de acción */}
      <div className={styles['botones-concierto']}>
        <button onClick={() => onVerEnMapa(concierto)}>Ver en mapa</button>
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${concierto.ubicacion_detalle?.coordenadas[1]},${concierto.ubicacion_detalle?.coordenadas[0]}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Cómo llegar
        </a>
        <a 
          href={concierto.url_evento}
          target="_blank"
          rel="noopener noreferrer"
        >
          Entradas
        </a>
      </div>

    </div>
  );
};

export default TarjetaConcierto;
