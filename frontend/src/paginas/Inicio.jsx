import React, { useMemo, useState, useEffect } from 'react';
import PieDePagina from '../componentes/PieDePagina/PieDePagina';
import Mapa from '../componentes/Mapa/Mapa';
import TarjetaConcierto from '../componentes/TarjetaConcierto/TarjetaConcierto';
import Filtros from '../componentes/Filtros/Filtros';
import EstadoVacio from '../componentes/EstadoVacio/EstadoVacio';
import Encabezado from '../componentes/Encabezado/Encabezado';
import { conciertoServicio } from '../servicios/conciertoServicio';

const Inicio = () => {
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);
  const [conciertosBase, setConciertosBase] = useState([]); // Todos los conciertos sin filtrar
  const [conciertos, setConciertos] = useState([]); // Conciertos filtrados que se muestran
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [centroMapa, setCentroMapa] = useState(null);
  const [filtros, setFiltros] = useState({
    artista: '',
    radio: 5,
    ubicacionActual: null
  });

  // 🧠 Obtener lista única de artistas para el select
  const artistas = useMemo(() => {
    return [...new Set(
      conciertosBase
        .filter(c => c.artista)
        .map(c => c.artista)
    )].sort();
  }, [conciertosBase]);

  // 📍 Calcular distancia entre dos coordenadas (Haversine)
  const distanciaKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 🎯 Mostrar concierto en mapa
  const verEnMapa = (concierto) => {
    if (concierto.ubicacion_detalle?.coordenadas) {
      setCentroMapa({
        lat: concierto.ubicacion_detalle.coordenadas[1],
        lng: concierto.ubicacion_detalle.coordenadas[0],
        zoom: 15
      });
      setConciertoSeleccionado(concierto);
      document.querySelector('.contenedor-mapa')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // 🧩 Cargar todos los conciertos una sola vez (sin filtros)
  useEffect(() => {
    let activo = true;

    const cargarConciertos = async () => {
      try {
        setCargando(true);
        setError(null);
        const datos = await conciertoServicio.obtenerConciertos();

        if (activo) {
          setConciertosBase(datos);
          setConciertos(datos); // Mostrar todos inicialmente
        }
      } catch (err) {
        if (activo) {
          console.error(err);
          setError('Error al cargar los conciertos');
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarConciertos();

    return () => { activo = false; };
  }, []);

  // 🎚️ Aplicar filtros (artista + ubicación + radio)
  useEffect(() => {
    if (!conciertosBase || conciertosBase.length === 0) return;

    const timeout = setTimeout(() => {
      const filtrados = conciertosBase.filter(c => {
        // 🎵 Filtro por artista
        const pasaArtista = filtros.artista
          ? c.artista?.toLowerCase().includes(filtros.artista.toLowerCase())
          : true;
        if (!pasaArtista) return false;

        // 📍 Filtro por ubicación
        if (filtros.ubicacionActual && c.ubicacion_detalle?.coordenadas) {
          const lat = c.ubicacion_detalle.coordenadas[1];
          const lng = c.ubicacion_detalle.coordenadas[0];
          const d = distanciaKm(
            filtros.ubicacionActual.lat,
            filtros.ubicacionActual.lng,
            lat,
            lng
          );
          return d <= filtros.radio;
        }

        return true;
      });

      setConciertos(filtrados);
    }, 300); // ⏱️ debounce: evita recalcular demasiado rápido

    return () => clearTimeout(timeout);
  }, [filtros, conciertosBase]);

  return (
    <div className="pagina-inicio">
      <Encabezado />

      <div className="fondo-patron"></div>

      <div className="contenedor-principal">
        <div className="titulo-wrapper">
          <h1 className="titulo-principal">Conciertos Disponibles</h1>
          {!cargando && conciertos.length > 0 && (
            <span className="contador-conciertos">{conciertos.length}</span>
          )}
        </div>

        <img src="/logo.png" alt="Concierto Finder Logo" className="logo-principal" />

        <p className="descripcion-principal">
          Explora los próximos conciertos en Buenos Aires y alrededores
        </p>

        {/* 🧭 Filtros de búsqueda */}
        <Filtros filtros={filtros} setFiltros={setFiltros} artistas={artistas} />

        <div className="contenedor-grid">
          {/* 🗺️ Columna del mapa */}
          <div className="col-mapa">
            {error ? (
              <EstadoVacio tipo="error" />
            ) : (
              <Mapa
                centro={
                  centroMapa ||
                  (filtros.ubicacionActual
                    ? [filtros.ubicacionActual.lat, filtros.ubicacionActual.lng]
                    : [-34.6037, -58.3816]) // Centro por defecto (BsAs)
                }
                zoom={centroMapa?.zoom}
                conciertos={conciertos}
                ubicacionUsuario={filtros.ubicacionActual}
                radioKm={filtros.radio}
                seleccionadoId={conciertoSeleccionado?.id}
              />
            )}
          </div>

          {/* 🎟️ Columna con lista de conciertos */}
          <div className="col-lista">
            {error ? (
              <EstadoVacio tipo="error" />
            ) : conciertos.length === 0 ? (
              <EstadoVacio tipo="sin-resultados" />
            ) : (
              conciertos.map(concierto => (
                <TarjetaConcierto
                  key={concierto.id}
                  concierto={concierto}
                  seleccionado={conciertoSeleccionado?.id === concierto.id}
                  onVerEnMapa={verEnMapa}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <PieDePagina />
    </div>
  );
};

export default Inicio;
