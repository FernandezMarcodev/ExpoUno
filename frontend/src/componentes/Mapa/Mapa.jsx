import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, Marker, Popup, useMap, Circle, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./mapa.module.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CambiarVistaMapa = ({ centro, zoom }) => {
  const mapa = useMap();

  useEffect(() => {
    if (!centro) return;
    const posicion = Array.isArray(centro) ? centro : [centro.lat, centro.lng];
    try {
      mapa.closePopup(); 
    } catch { }
    mapa.setView(posicion, zoom || 11, { animate: true, duration: 1 });
  }, [centro, zoom, mapa]);

  return null;
};

const AjustarVistaRadio = ({ centro, ubicacionUsuario, radioKm }) => {
  const map = useMap();

  useEffect(() => {
    if (!ubicacionUsuario || !radioKm || centro) return;
    const circle = L.circle([ubicacionUsuario.lat, ubicacionUsuario.lng], { radius: radioKm * 1000 });
    const bounds = circle.getBounds();
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [ubicacionUsuario, radioKm, centro, map]);

  return null;
};

const iconFor = (grupoConciertos) => {
  const todosAgotados = grupoConciertos.every(c => c?.isAgotado);
  const extraClass = todosAgotados ? "agotado" : "disponible";
  const html = `
    <div class="marker-custom ${extraClass}">
      <span class="marker-inner"></span>
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

function Mapa({ centro, zoom, conciertos = [], ubicacionUsuario, radioKm, seleccionadoId }) {
  const centroInicial = centro || [-34.6037, -58.3816];

  // Agrupar conciertos por ubicación exacta
  const grupos = useMemo(() => {
    const map = new Map(); // key = "lat,lng" -> {lat, lng, conciertos:[]}
    conciertos
      .filter(c => c.ubicacion_detalle?.coordenadas)
      .forEach(c => {
        const lat = c.ubicacion_detalle.coordenadas[1];
        const lng = c.ubicacion_detalle.coordenadas[0];
        const key = `${lat},${lng}`;
        if (!map.has(key)) {
          map.set(key, { lat, lng, conciertos: [] });
        }
        map.get(key).conciertos.push(c);
      });
    return Array.from(map.values());
  }, [conciertos]);

  const popupRefs = useRef({});
  
  const ControlarPopupSeleccion = ({ seleccionadoId }) => {
    const map = useMap();

    useEffect(() => {
      if (!seleccionadoId) return;
      const grupo = grupos.find(g => g.conciertos.some(c => c.id === seleccionadoId));
      if (!grupo) return;

      const key = `${grupo.lat},${grupo.lng}`;
      const ref = popupRefs.current[key];
      if (ref && ref._source) {
        try {
          map.flyTo([grupo.lat, grupo.lng], zoom || 15, { animate: true, duration: 0.8 });
        } catch { }
        try {
          ref.openOn(map);
        } catch { }
      }
    }, [seleccionadoId, grupos, zoom]);

    return null;
  };

  return (
    <div className={styles.contenedorMapa}>
      <MapContainer
        center={centroInicial}
        zoom={zoom || 11}
        zoomControl={false}
        style={{ width: "100%", height: "700px" }}
        className={styles.mapa}
      >
        <CambiarVistaMapa centro={centro} zoom={zoom} />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        <AjustarVistaRadio centro={centro} ubicacionUsuario={ubicacionUsuario} radioKm={radioKm} />

        {ubicacionUsuario && (
          <>
            <CircleMarker
              center={[ubicacionUsuario.lat, ubicacionUsuario.lng]}
              radius={7}
              pathOptions={{
                color: "#1a73e8",
                fillColor: "#1a73e8",
                fillOpacity: 1,
                weight: 2
              }}
            />
          </>
        )}

        {ubicacionUsuario && radioKm > 0 && (
          <Circle
            center={[ubicacionUsuario.lat, ubicacionUsuario.lng]}
            radius={radioKm * 1000}
            pathOptions={{
              color: "#1a73e8",
              fillColor: "#1a73e8",
              fillOpacity: 0.05,
              weight: 2
            }}
          />
        )}

        {grupos.map(grupo => {
          const key = `${grupo.lat},${grupo.lng}`;
          const lista = grupo.conciertos;
          const seleccionadoEnGrupo = lista.find(c => c.id === seleccionadoId);
          return (
            <Marker
              key={key}
              position={[grupo.lat, grupo.lng]}
              icon={iconFor(lista)}
            >
              <Popup whenCreated={(popup) => { popupRefs.current[key] = popup; }}>
                <div className={styles.popupContent}>
                  {lista.length === 1 ? (
                    <>
                      <div className={styles.popupTitle}>{lista[0].artista}</div>
                      <div className={styles.popupSub}>{lista[0].nombre || ""}</div>
                      <div className={styles.popupActions}>
                        <a href={lista[0].url_evento} target="_blank" rel="noopener noreferrer">Entradas</a>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.popupTitle}>
                        {lista[0].ubicacion_detalle?.nombre || "Ubicación"} — {lista.length} conciertos
                      </div>
                      <div className={styles.popupList}>
                        {lista.map(c => (
                          <div
                            key={c.id}
                            className={`${styles.popupItem} ${c.id === seleccionadoId ? styles.popupItemSeleccionado : ""}`}
                          >
                           <div className={styles.popupItemTitulo}>
                                {c.artista}
                                {c.nombre && c.nombre !== c.artista ? ` — ${c.nombre}` : ""}
                           </div>

                            <div className={styles.popupItemMeta}>
                              {new Date(c.fecha).toLocaleDateString('es-AR')}
                              {c.hora ? ` · ${c.hora.substring(0, 5)}` : ""}
                              {c.isAgotado ? " · Agotado" : ""}
                            </div>
                            <div className={styles.popupActions}>
                              <a href={c.url_evento} target="_blank" rel="noopener noreferrer">Entradas</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <ControlarPopupSeleccion seleccionadoId={seleccionadoId} />
      </MapContainer>
    </div>
  );
}

export default Mapa;