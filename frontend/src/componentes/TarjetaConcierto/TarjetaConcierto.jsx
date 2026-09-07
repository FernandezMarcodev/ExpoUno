import styles from "./tarjetaConcierto.module.css";
import React from "react";
import { FaUser, FaMapMarkerAlt, FaCalendar, FaClock, FaTicketAlt, FaDirections, FaMapPin, FaChild } from "react-icons/fa";

const TarjetaConcierto = ({ concierto, seleccionado, onVerEnMapa }) => {
  return (
    <div className={`${styles.tarjeta} ${seleccionado ? styles.tarjetaSeleccionada : ""}`}>
      <div className={styles.cabecera}>
        <h3 className={styles.nombre}>{concierto.nombre}</h3>
        {concierto.isAgotado ? (
          <span className={styles.estadoAgotado}>Agotado</span>
        ) : (
          <span className={styles.estadoDisponible}>Disponible</span>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.filaInfo}>
          <FaUser className={styles.iconoInfo} />
          <span>{concierto.artista}</span>
        </div>
        <div className={styles.filaInfo}>
          <FaMapMarkerAlt className={styles.iconoInfo} />
          <span>{concierto.ubicacion_detalle?.nombre}</span>
        </div>
        <div className={styles.filaInfo}>
          <FaCalendar className={styles.iconoInfo} />
          <span>{new Date(concierto.fecha).toLocaleDateString('es-AR')}</span>
        </div>
        {concierto.hora && (
          <div className={styles.filaInfo}>
            <FaClock className={styles.iconoInfo} />
            <span>{concierto.hora.substring(0, 5)}</span>
          </div>
        )}
        {concierto.isAptoMenores && (
          <div className={styles.aptoMenores}>
            <FaChild className={styles.iconoMenores} />
            Apto para menores
          </div>
        )}
      </div>

      <div className={styles.acciones}>
        <button
          className={styles.botonMapa}
          onClick={() => onVerEnMapa(concierto)}
        >
          <FaMapPin className={styles.iconoAccion} />
          Ver en mapa
        </button>
        <a
          className={styles.enlaceSecundario}
          href={`https://www.google.com/maps/dir/?api=1&destination=${concierto.ubicacion_detalle?.coordenadas[1]},${concierto.ubicacion_detalle?.coordenadas[0]}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaDirections className={styles.iconoAccion} />
          Como llegar
        </a>
        <a
          className={styles.botonEntradas}
          href={concierto.url_evento}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaTicketAlt className={styles.iconoAccion} />
          Entradas
        </a>
      </div>
    </div>
  );
};

export default TarjetaConcierto;
