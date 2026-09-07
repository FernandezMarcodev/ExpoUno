import styles from "./filtros.module.css";
import React from "react";
import { FaMapMarkerAlt, FaUser, FaSlidersH } from "react-icons/fa";

function Filtros({ filtros, setFiltros, artistas }) {
  const toggleUbicacion = () => {
    if (filtros.ubicacionActual) {
      setFiltros({
        ...filtros,
        ubicacionActual: null
      });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFiltros({
            ...filtros,
            ubicacionActual: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            }
          });
        },
        (err) => {
          alert("No se pudo obtener tu ubicacion");
          console.error(err);
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalizacion");
    }
  };

  return (
    <div className={styles.filtros}>
      <div className={styles.encabezadoFiltros}>
        <FaSlidersH className={styles.iconoEncabezado} />
        <h2 className={styles.tituloFiltros}>Explorar Conciertos</h2>
      </div>

      <div className={styles.filaFiltros}>
        <div className={styles.grupoFiltros}>
          <label className={styles.labelFiltro}>
            <FaUser className={styles.iconoLabel} />
            Artista
          </label>
          <select
            className={styles.selectFiltro}
            value={filtros.artista}
            onChange={(e) => setFiltros({ ...filtros, artista: e.target.value })}
          >
            <option value="">Todos los artistas</option>
            {artistas.sort().map((artista) => (
              <option key={artista} value={artista}>
                {artista}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.grupoFiltros}>
          <label className={styles.labelFiltro}>
            <FaMapMarkerAlt className={styles.iconoLabel} />
            Ubicacion
          </label>
          <button
            className={`${styles.botonUbicacion} ${filtros.ubicacionActual ? styles.botonUbicacionActivo : ""}`}
            onClick={toggleUbicacion}
          >
            <FaMapMarkerAlt className={styles.iconoBoton} />
            {filtros.ubicacionActual ? "Desactivar ubicacion" : "Activar ubicacion"}
          </button>
        </div>

        {filtros.ubicacionActual && (
          <div className={styles.grupoFiltros}>
            <label className={styles.labelFiltro}>
              Radio: {filtros.radio} km
            </label>
            <div className={styles.filaRadio}>
              <input
                type="range"
                className={styles.sliderRadio}
                min="1"
                max="100"
                value={filtros.radio}
                onChange={(e) =>
                  setFiltros({ ...filtros, radio: parseInt(e.target.value) })
                }
              />
              <input
                type="number"
                className={styles.inputNumero}
                min="1"
                max="100"
                value={filtros.radio}
                onChange={(e) =>
                  setFiltros({ ...filtros, radio: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Filtros;
