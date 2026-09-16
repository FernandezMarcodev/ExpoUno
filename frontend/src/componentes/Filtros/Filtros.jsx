import styles from "./filtros.module.css";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaMapMarkerAlt, FaUser, FaSlidersH, FaTimes } from "react-icons/fa";
import { normalizarTexto } from "../../utilidades/texto";

const CLAVE_COLAPSADO = "filtrosColapsados";

function leerColapsado() {
  try {
    const guardado = localStorage.getItem(CLAVE_COLAPSADO);
    if (guardado !== null) return guardado === "1";
  } catch { /* sin almacenamiento */ }
  return false;
}

const SelectorArtista = ({ artistas, valor, alCambiar }) => {
  const [texto, setTexto] = useState(valor);
  const [abierto, setAbierto] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const refContenedor = useRef(null);

  useEffect(() => {
    setTexto(valor);
  }, [valor]);

  useEffect(() => {
    if (!abierto) return;
    const alClicAfuera = (evento) => {
      if (refContenedor.current && !refContenedor.current.contains(evento.target)) {
        setAbierto(false);
      }
    };
    document.addEventListener("mousedown", alClicAfuera);
    return () => document.removeEventListener("mousedown", alClicAfuera);
  }, [abierto]);

  const sugerencias = useMemo(() => {
    const termino = normalizarTexto(texto.trim());
    if (!termino) return artistas.slice(0, 8);
    return artistas.filter((a) => normalizarTexto(a).includes(termino)).slice(0, 8);
  }, [artistas, texto]);

  const seleccionar = (artista) => {
    alCambiar(artista);
    setTexto(artista);
    setAbierto(false);
    setIndiceActivo(-1);
  };

  const limpiar = () => {
    alCambiar("");
    setTexto("");
    setAbierto(false);
    setIndiceActivo(-1);
  };

  const alTecla = (evento) => {
    if (evento.key === "Escape") {
      setAbierto(false);
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setAbierto(true);
      setIndiceActivo((anterior) => (anterior + 1) % Math.max(sugerencias.length, 1));
      return;
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setIndiceActivo((anterior) => (anterior <= 0 ? sugerencias.length - 1 : anterior - 1));
      return;
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      if (abierto && sugerencias[indiceActivo]) {
        seleccionar(sugerencias[indiceActivo]);
      }
    }
  };

  return (
    <div ref={refContenedor} className={styles.selectorArtista}>
      <FaUser className={styles.iconoBusqueda} />
      <input
        value={texto}
        onChange={(evento) => {
          const nuevo = evento.target.value;
          setTexto(nuevo);
          alCambiar(nuevo);
          setAbierto(true);
          setIndiceActivo(-1);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={alTecla}
        placeholder="Buscá un artista…"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        aria-label="Buscar artista"
        className={styles.inputArtista}
      />
      {texto && (
        <button
          className={styles.botonLimpiar}
          onClick={limpiar}
          aria-label="Limpiar artista"
          title="Limpiar artista"
        >
          <FaTimes />
        </button>
      )}

      {abierto && (
        <div className={styles.sugerencias}>
          {sugerencias.length === 0 ? (
            <p className={styles.sinCoincidencias}>Sin coincidencias</p>
          ) : (
            <ul className={styles.listaSugerencias}>
              {sugerencias.map((sugerencia, indice) => (
                <li key={sugerencia}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={indice === indiceActivo}
                    onMouseEnter={() => setIndiceActivo(indice)}
                    onClick={() => seleccionar(sugerencia)}
                    className={`${styles.sugerencia} ${
                      indice === indiceActivo ? styles.sugerenciaActiva : ""
                    }`}
                  >
                    {sugerencia}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

function Filtros({ filtros, setFiltros, artistas }) {
  const [colapsado, setColapsado] = useState(leerColapsado);

  const alternarColapsado = () => {
    setColapsado((previo) => {
      const nuevo = !previo;
      try {
        localStorage.setItem(CLAVE_COLAPSADO, nuevo ? "1" : "0");
      } catch { /* sin almacenamiento */ }
      return nuevo;
    });
  };

  const toggleUbicacion = () => {
    if (filtros.ubicacionActual) {
      setFiltros({ ...filtros, ubicacionActual: null });
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

  const resumen = [
    filtros.artista ? `Artista: ${filtros.artista}` : "Todos los artistas",
    filtros.ubicacionActual ? `cerca de tu ubicación · ${filtros.radio} km` : "",
  ]
    .filter(Boolean)
    .join(" – ");

  return (
    <section className={styles.filtros}>
      <button
        type="button"
        onClick={alternarColapsado}
        aria-expanded={!colapsado}
        className={styles.cabeceraFiltrosBoton}
      >
        <span className={styles.encabezadoFiltros}>
          <FaSlidersH className={styles.iconoEncabezado} />
          <span className={styles.tituloFiltros}>Filtrar conciertos</span>
        </span>
        {colapsado && <span className={styles.resumen}>{resumen}</span>}
        <span className={styles.flechaColapsar} aria-hidden="true">
          {colapsado ? "▼" : "▲"}
        </span>
      </button>

      {!colapsado && (
        <div className={styles.cuerpoFiltros}>
          <div className={styles.filaFiltros}>
            <div className={styles.grupoFiltros}>
              <label className={styles.labelFiltro}>
                <FaUser className={styles.iconoLabel} />
                Artista
              </label>
              <SelectorArtista
                artistas={artistas}
                valor={filtros.artista}
                alCambiar={(artista) => setFiltros({ ...filtros, artista })}
              />
              {artistas.length > 0 && (
                <p className={styles.cantidadArtistas}>
                  {artistas.length} artistas disponibles
                </p>
              )}
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
      )}
    </section>
  );
}

export default Filtros;