import styles from "./tarjetaConcierto.module.css";
import React from "react";
import { FaUser, FaMapMarkerAlt, FaCalendar, FaClock, FaTicketAlt, FaDirections, FaMapPin, FaChild, FaHeart, FaRegHeart, FaBell, FaRegBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import { useFavoritos } from "../../contextos/FavoritosContext";
import { useSeguidos } from "../../contextos/SeguidosContext";

const TarjetaConcierto = ({ concierto, seleccionado, onVerEnMapa }) => {
  const navigate = useNavigate();
  const { autenticado } = useAuth();
  const { esFavorito, alternarFavorito } = useFavoritos();
  const { esSeguido, alternarSeguido } = useSeguidos();
  const favorito = esFavorito(concierto.id);
  const siguiendo = esSeguido(concierto.artista);

  const alternar = async () => {
    if (!autenticado) {
      navigate("/login");
      return;
    }
    await alternarFavorito(concierto);
  };

  const seguir = async () => {
    if (!autenticado) {
      navigate("/login");
      return;
    }
    await alternarSeguido(concierto.artista);
  };

  return (
    <div className={`${styles.tarjeta} ${seleccionado ? styles.tarjetaSeleccionada : ""}`}>
      <div className={styles.cabecera}>
        <h3 className={styles.nombre}>{concierto.nombre}</h3>
        <div className={styles.cabeceraDerecha}>
          <button
            className={`${styles.botonFavorito} ${favorito ? styles.favoritoActivo : ""}`}
            onClick={alternar}
            aria-label={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
            title={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            {favorito ? (
              <FaHeart className={styles.iconoCorazon} />
            ) : (
              <FaRegHeart className={styles.iconoCorazon} />
            )}
          </button>
        </div>
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
          className={`${styles.botonSeguir} ${siguiendo ? styles.siguiendoActivo : ""}`}
          onClick={seguir}
        >
          {siguiendo ? (
            <FaBell className={styles.iconoAccion} />
          ) : (
            <FaRegBell className={styles.iconoAccion} />
          )}
          {siguiendo ? "Siguiendo" : "Seguir artista"}
        </button>
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
