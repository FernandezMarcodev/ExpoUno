import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Encabezado from '../componentes/Encabezado/Encabezado';
import PieDePagina from '../componentes/PieDePagina/PieDePagina';
import TarjetaGrupo from '../componentes/TarjetaGrupo/TarjetaGrupo';
import EstadoVacio from '../componentes/EstadoVacio/EstadoVacio';
import Cargando from '../componentes/Cargando/Cargando';
import Mapa from '../componentes/Mapa/Mapa';
import { useAuth } from '../contextos/AuthContext';
import { useFavoritos } from '../contextos/FavoritosContext';
import { agruparPorPunto } from '../utilidades/grupos';

const MisFavoritos = () => {
  const { autenticado, cargando } = useAuth();
  const { favoritos, cargando: cargandoFavoritos } = useFavoritos();
  const [conciertoSeleccionado, setConciertoSeleccionado] = useState(null);

  const conciertos = useMemo(
    () => [...favoritos].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)),
    [favoritos]
  );

  const grupos = useMemo(() => agruparPorPunto(conciertos), [conciertos]);

  const verEnMapa = (concierto) => {
    if (concierto.ubicacion_detalle?.coordenadas) {
      setConciertoSeleccionado(concierto);
      document.getElementById('col-mapa')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (cargando) return null;
  if (!autenticado) return <Navigate to="/login" replace />;

  return (
    <div className="pagina-inicio">
      <Encabezado />

      <main className="contenedor-principal">
        <section className="titulo-section">
          <h2 className="titulo-principal">
            Mis Favoritos
            {!cargandoFavoritos && conciertos.length > 0 && (
              <span className="contador-conciertos">{conciertos.length}</span>
            )}
          </h2>
          <p className="descripcion-principal">Los conciertos que te gustaron</p>
        </section>

        <div className="contenedor-grid" id="zona-mapa">
          <div className="col-mapa" id="col-mapa">
            {cargandoFavoritos ? (
              <Cargando mensaje="Cargando favoritos..." />
            ) : (
              <Mapa
                centro={
                  conciertoSeleccionado?.ubicacion_detalle?.coordenadas
                    ? [conciertoSeleccionado.ubicacion_detalle.coordenadas[1], conciertoSeleccionado.ubicacion_detalle.coordenadas[0]]
                    : [-34.6037, -58.3816]
                }
                zoom={conciertoSeleccionado?.zoom || 5}
                conciertos={conciertos}
                seleccionadoId={conciertoSeleccionado?.id}
              />
            )}
          </div>

          <div className="col-lista">
            {cargandoFavoritos ? (
              <Cargando mensaje="Cargando favoritos..." />
            ) : conciertos.length === 0 ? (
              <EstadoVacio
                tipo="sin-resultados"
                titulo="Todavía no guardaste favoritos"
                descripcion="Tocá el corazón en una tarjeta para guardar el concierto y verlo acá."
              />
            ) : (
              grupos.map(grupo => (
                <TarjetaGrupo
                  key={grupo.lat ? `${grupo.lat},${grupo.lng}` : `suelto-${grupo.conciertos[0].id}`}
                  grupo={grupo}
                  seleccionadoId={conciertoSeleccionado?.id}
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

export default MisFavoritos;