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
  const [conciertosBase, setConciertosBase] = useState([]);
  const [conciertos, setConciertos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [centroMapa, setCentroMapa] = useState(null);
  const [filtros, setFiltros] = useState({
    artista: '',
    radio: 5,
    ubicacionActual: null
  });

  const artistas = useMemo(() => {
    return [...new Set(
      conciertosBase
        .filter(c => c.artista)
        .map(c => c.artista)
    )].sort();
  }, [conciertosBase]);

  const distanciaKm = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const verEnMapa = (concierto) => {
    if (concierto.ubicacion_detalle?.coordenadas) {
      setCentroMapa({
        lat: concierto.ubicacion_detalle.coordenadas[1],
        lng: concierto.ubicacion_detalle.coordenadas[0],
        zoom: 15
      });
      setConciertoSeleccionado(concierto);
      document.getElementById('col-mapa')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  useEffect(() => {
    let activo = true;

    const cargarConciertos = async () => {
      try {
        setCargando(true);
        setError(null);
        const datos = await conciertoServicio.obtenerConciertos();

        if (activo) {
          setConciertosBase(datos);
          setConciertos(datos);
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

  useEffect(() => {
    if (!conciertosBase || conciertosBase.length === 0) return;

    const timeout = setTimeout(() => {
      const filtrados = conciertosBase.filter(c => {
        const pasaArtista = filtros.artista
          ? c.artista?.toLowerCase().includes(filtros.artista.toLowerCase())
          : true;
        if (!pasaArtista) return false;

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
    }, 300);

    return () => clearTimeout(timeout);
  }, [filtros, conciertosBase]);

  return (
    <div className="pagina-inicio">
      <Encabezado />

      <main className="contenedor-principal">
        <section className="titulo-section">
          <img src="/logo.png" alt="Concierto Finder" className="logo-principal" />
          <h2 className="titulo-principal">
            Conciertos Disponibles
            {!cargando && conciertos.length > 0 && (
              <span className="contador-conciertos">{conciertos.length}</span>
            )}
          </h2>
          <p className="descripcion-principal">
            Explora los proximos conciertos en Buenos Aires y alrededores
          </p>
        </section>

        <Filtros filtros={filtros} setFiltros={setFiltros} artistas={artistas} />

        <div className="contenedor-grid" id="zona-mapa">
          <div className="col-mapa" id="col-mapa">
            {error ? (
              <EstadoVacio tipo="error" />
            ) : (
              <Mapa
                centro={
                  centroMapa ||
                  (filtros.ubicacionActual
                    ? [filtros.ubicacionActual.lat, filtros.ubicacionActual.lng]
                    : [-34.6037, -58.3816])
                }
                zoom={centroMapa?.zoom}
                conciertos={conciertos}
                ubicacionUsuario={filtros.ubicacionActual}
                radioKm={filtros.radio}
                seleccionadoId={conciertoSeleccionado?.id}
              />
            )}
          </div>

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
      </main>

      <PieDePagina />
    </div>
  );
};

export default Inicio;
