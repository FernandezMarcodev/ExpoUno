import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, ZoomControl, Marker, Popup, useMap, Circle, CircleMarker } from "react-leaflet";
import { FiMoon, FiRefreshCw, FiSun } from "react-icons/fi";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./mapa.module.css";

const CLAVE_ESTILO_MAPA = "mapaEstilo";

const leerEstiloMapa = () => {
  try {
    const guardado = localStorage.getItem(CLAVE_ESTILO_MAPA);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch { /* sin almacenamiento */ }
  return "auto";
};

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

// Región renderizable: Buenos Aires y alrededores (mismo criterio que el backend).
const AMBA_MIN_LAT = -35.15;
const AMBA_MAX_LAT = -34.2;
const AMBA_MIN_LNG = -58.95;
const AMBA_MAX_LNG = -57.7;
// Límite de navegación del mapa: Argentina completa.
const ARG_MAX_BOUNDS = [[-55.05, -73.6], [-21.7, -53.6]];

const enAmba = (lat, lng) =>
  lat >= AMBA_MIN_LAT && lat <= AMBA_MAX_LAT && lng >= AMBA_MIN_LNG && lng <= AMBA_MAX_LNG;

const SelectorEstiloMapa = ({ valor, alCambiar }) => {
  const opciones = [
    { estilo: "auto", icono: <FiRefreshCw />, etiqueta: "Automático (según tema)" },
    { estilo: "claro", icono: <FiSun />, etiqueta: "Mapa claro" },
    { estilo: "oscuro", icono: <FiMoon />, etiqueta: "Mapa oscuro" },
  ];

  return (
    <div className={styles.selectorEstilo}>
      {opciones.map(opcion => (
        <button
          key={opcion.estilo}
          type="button"
          onClick={() => alCambiar(opcion.estilo)}
          aria-pressed={valor === opcion.estilo}
          aria-label={opcion.etiqueta}
          title={opcion.etiqueta}
          className={`${styles.selectorBoton} ${valor === opcion.estilo ? styles.selectorBotonActivo : ""}`}
        >
          {opcion.icono}
        </button>
      ))}
    </div>
  );
};

function Mapa({ centro, zoom, conciertos = [], ubicacionUsuario, radioKm, seleccionadoId }) {
  const [modoOscuro, setModoOscuro] = useState(
    () => localStorage.getItem("tema") === "oscuro"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setModoOscuro(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [estiloMapa, setEstiloMapa] = useState(leerEstiloMapa);
  const usarOscuro = estiloMapa === "oscuro" || (estiloMapa === "auto" && modoOscuro);

  const cambiarEstilo = (estilo) => {
    setEstiloMapa(estilo);
    try {
      localStorage.setItem(CLAVE_ESTILO_MAPA, estilo);
    } catch { /* sin almacenamiento */ }
  };

  const centroInicial = centro || [-34.6037, -58.3816];

  // Agrupar conciertos por ubicación exacta
  const grupos = useMemo(() => {
    const map = new Map(); // key = "lat,lng" -> {lat, lng, conciertos:[]}
    conciertos
      .filter(c => c.ubicacion_detalle?.coordenadas)
      .forEach(c => {
        const lat = c.ubicacion_detalle.coordenadas[1];
        const lng = c.ubicacion_detalle.coordenadas[0];
        if (!enAmba(lat, lng)) return;
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
    <div className={`${styles.contenedorMapa} ${usarOscuro ? styles.tilesOscuro : ""}`}>
      <MapContainer
        center={centroInicial}
        zoom={zoom || 11}
        zoomControl={false}
        maxBounds={ARG_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ width: "100%", height: "700px" }}
        className={styles.mapa}
      >
        <CambiarVistaMapa centro={centro} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
      <SelectorEstiloMapa valor={estiloMapa} alCambiar={cambiarEstilo} />
    </div>
  );
}

export default Mapa;