import styles from "./filtros.module.css";
import React from "react";

function Filtros({ filtros, setFiltros, artistas }) {
  // Activar/Desactivar ubicación actual (toggle)
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
              accuracy: pos.coords.accuracy // en metros
            }
          });
        },
        (err) => {
          alert("No se pudo obtener tu ubicación");
          console.error(err);
        }
      );
    } else {
      alert("Tu navegador no soporta geolocalización");
    }
  };

  return (
    <div className={styles.filtros}>
      <h2>Filtrar Conciertos</h2>

      {/* Botón de ubicación */}
      <button onClick={toggleUbicacion}>
        {filtros.ubicacionActual ? "Desactivar ubicación" : "Activar ubicación"}
      </button>

      {/* Radio de búsqueda (solo si hay ubicación) */}
      {filtros.ubicacionActual && (
        <>
          <label>Radio de búsqueda (km)</label>
          <input
            type="range"
            min="1"
            max="100"
            value={filtros.radio}
            onChange={(e) =>
              setFiltros({ ...filtros, radio: parseInt(e.target.value) })
            }
          />
          <input
            type="number"
            min="1"
            max="50"
            value={filtros.radio}
            onChange={(e) =>
              setFiltros({ ...filtros, radio: parseInt(e.target.value) })
            }
          />
        </>
      )}

      {/* Filtro por artista */}
      <label>Seleccionar Artista</label>
      <select
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
  );
}

export default Filtros;
