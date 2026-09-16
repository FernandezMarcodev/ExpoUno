import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PieDePagina from '../componentes/PieDePagina/PieDePagina';
import Mapa from '../componentes/Mapa/Mapa';
import TarjetaConcierto from '../componentes/TarjetaConcierto/TarjetaConcierto';
import TarjetaGrupo from '../componentes/TarjetaGrupo/TarjetaGrupo';
import Filtros from '../componentes/Filtros/Filtros';
import EstadoVacio from '../componentes/EstadoVacio/EstadoVacio';
import Cargando from '../componentes/Cargando/Cargando';
import Encabezado from '../componentes/Encabezado/Encabezado';
import { conciertoServicio } from '../servicios/conciertoServicio';
import { agruparPorPunto } from '../utilidades/grupos';
import { normalizarTexto } from '../utilidades/texto';
import { useAuth } from '../contextos/AuthContext';
import { useFavoritos } from '../contextos/FavoritosContext';
import { useSeguidos } from '../contextos/SeguidosContext';

const VISTAS = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'favoritos', etiqueta: 'Mis favoritos' },
  { valor: 'siguiendo', etiqueta: 'Siguiendo' },
];

const Inicio = () => {
  const { autenticado } = useAuth();
  const { cantidadFavoritos, esFavorito } = useFavoritos();
  const { seguidos } = useSeguidos();
  const navegar = useNavigate();

  const [vista, setVista] = useState('todos');
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
    )].sort((a, b) => a.localeCompare(b, 'es'));
  }, [conciertosBase]);

  const setSeguidosNorm = useMemo(
    () => new Set(seguidos.map((a) => normalizarTexto(a))),
    [seguidos]
  );

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

  const seleccionarVista = (nueva) => {
    if (nueva !== 'todos' && !autenticado) {
      navegar('/login');
      return;
    }
    setVista(nueva);
  };

  useEffect(() => {
    if (!autenticado) setVista('todos');
  }, [autenticado]);

  useEffect(() => {
    if (!conciertosBase || conciertosBase.length === 0) return;

    const timeout = setTimeout(() => {
      const nombreArtista = normalizarTexto(filtros.artista);

      const filtrados = conciertosBase.filter(c => {
        if (vista === 'favoritos' && !esFavorito(c.id)) return false;
        if (vista === 'siguiendo') {
          const nombreNorm = normalizarTexto(c.artista);
          if (!c.artista?.trim() || !setSeguidosNorm.has(nombreNorm)) return false;
        }

        if (nombreArtista && !normalizarTexto(c.artista).includes(nombreArtista)) return false;

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
  }, [filtros, conciertosBase, vista, esFavorito, setSeguidosNorm]);

  const grupos = useMemo(() => agruparPorPunto(conciertos), [conciertos]);

  const reiniciarFiltros = () => {
    setFiltros({ artista: '', radio: 5, ubicacionActual: null });
    setVista('todos');
  };

  const mensajeVacio =
    vista === 'favoritos'
      ? { titulo: 'Todavía no guardaste favoritos', descripcion: 'Tocá el corazón en una tarjeta para guardar el concierto y verlo acá.' }
      : vista === 'siguiendo'
        ? { titulo: 'Todavía no seguís artistas', descripcion: 'Tocá «Seguir» en una tarjeta y vas a recibir avisos cuando tengan nuevos conciertos.' }
        : null;

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

        <div className="tabs-vista" role="tablist" aria-label="Vista de conciertos">
          {VISTAS.filter((v) => v.valor === 'todos' || autenticado).map((v) => (
            <button
              key={v.valor}
              role="tab"
              aria-selected={vista === v.valor}
              className={`tab-vista ${vista === v.valor ? 'tab-vistaActiva' : ''}`}
              onClick={() => seleccionarVista(v.valor)}
            >
              {v.valor === 'favoritos' && cantidadFavoritos > 0
                ? `Mis favoritos (${cantidadFavoritos})`
                : v.etiqueta}
            </button>
          ))}
        </div>

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
            ) : cargando ? (
              <Cargando />
            ) : conciertos.length === 0 ? (
              <EstadoVacio
                tipo="sin-resultados"
                titulo={mensajeVacio?.titulo}
                descripcion={mensajeVacio?.descripcion}
                onReiniciar={reiniciarFiltros}
              />
            ) : (
              grupos.map(grupo =>
                grupo.conciertos.length > 1 ? (
                  <TarjetaGrupo
                    key={grupo.lat ? `${grupo.lat},${grupo.lng}` : `suelto-${grupo.conciertos[0].id}`}
                    grupo={grupo}
                    seleccionadoId={conciertoSeleccionado?.id}
                    onVerEnMapa={verEnMapa}
                  />
                ) : (
                  <TarjetaConcierto
                    key={grupo.conciertos[0].id}
                    concierto={grupo.conciertos[0]}
                    seleccionado={conciertoSeleccionado?.id === grupo.conciertos[0].id}
                    onVerEnMapa={verEnMapa}
                  />
                )
              )
            )}
          </div>
        </div>
      </main>

      <PieDePagina />
    </div>
  );
};

export default Inicio;