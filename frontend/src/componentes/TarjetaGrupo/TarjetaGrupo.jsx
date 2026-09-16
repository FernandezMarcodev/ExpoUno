import styles from "./tarjetaGrupo.module.css";
import React from "react";
import { FaMapMarkerAlt, FaHeart, FaRegHeart, FaBell, FaRegBell, FaCalendar, FaClock, FaMapPin, FaTicketAlt, FaDirections } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contextos/AuthContext";
import { useFavoritos } from "../../contextos/FavoritosContext";
import { useSeguidos } from "../../contextos/SeguidosContext";

const TarjetaGrupo = ({ grupo, seleccionadoId, onVerEnMapa }) => {
  const navegar = useNavigate();
  const { autenticado } = useAuth();
  const { esFavorito, alternarFavorito } = useFavoritos();
  const { esSeguido, alternarSeguido } = useSeguidos();

  const ubicacion = grupo.ubicacion_detalle?.nombre || "Sin ubicación definida";
  const conciertos = grupo.conciertos;

  const cambiarFavorito = async (concierto) => {
    if (!autenticado) {
      navegar("/login");
      return;
    }
    await alternarFavorito(concierto);
  };

  const cambiarSeguido = async (artista) => {
    if (!autenticado) {
      navegar("/login");
      return;
    }
    await alternarSeguido(artista);
  };

  return (
    <div className={styles.grupo}>
      <div className={styles.cabecera}>
        <div className={styles.lugar}>
          <FaMapMarkerAlt className={styles.iconoLugar} />
          <span className={styles.nombreLugar}>{ubicacion}</span>
        </div>
        <span className={styles.contador}>
          {conciertos.length} {conciertos.length === 1 ? "concierto" : "conciertos"}
        </span>
      </div>

      <div className={styles.lista}>
        {conciertos.map((concierto) => {
          const favorito = esFavorito(concierto.id);
          const siguiendo = esSeguido(concierto.artista);
          return (
            <div
              key={concierto.id}
              className={`${styles.fila} ${
                concierto.id === seleccionadoId ? styles.filaSeleccionada : ""
              }`}
            >
              <div className={styles.filaPrincipal}>
                <div className={styles.filaInfo}>
                  <div className={styles.tituloFila}>
                    <span className={styles.artistaFila}>{concierto.artista}</span>
                    {concierto.nombre && concierto.nombre !== concierto.artista && (
                      <span className={styles.nombreFila}>{concierto.nombre}</span>
                    )}
                  </div>
                  <div className={styles.metaFila}>
                    <span className={styles.metaItem}>
                      <FaCalendar className={styles.iconoMeta} />
                      {new Date(concierto.fecha).toLocaleDateString("es-AR")}
                    </span>
                    {concierto.hora && (
                      <span className={styles.metaItem}>
                        <FaClock className={styles.iconoMeta} />
                        {concierto.hora.substring(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.accionesRapidas}>
                  <button
                    className={`${styles.botonSeguir} ${
                      siguiendo ? styles.botonSeguirActivo : ""
                    }`}
                    onClick={() => cambiarSeguido(concierto.artista)}
                    aria-pressed={siguiendo}
                    title={siguiendo ? "Dejar de seguir" : "Seguir artista"}
                  >
                    {siguiendo ? (
                      <FaBell className={styles.iconoAccion} />
                    ) : (
                      <FaRegBell className={styles.iconoAccion} />
                    )}
                    {siguiendo ? "Siguiendo" : "Seguir"}
                  </button>
                  <button
                    className={`${styles.botonFavorito} ${
                      favorito ? styles.botonFavoritoActivo : ""
                    }`}
                    onClick={() => cambiarFavorito(concierto)}
                    aria-label={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                    title={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                  >
                    {favorito ? (
                      <FaHeart className={styles.iconoAccion} />
                    ) : (
                      <FaRegHeart className={styles.iconoAccion} />
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.filaAcciones}>
                <button className={styles.botonMapa} onClick={() => onVerEnMapa(concierto)}>
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
        })}
      </div>
    </div>
  );
};

export default TarjetaGrupo;