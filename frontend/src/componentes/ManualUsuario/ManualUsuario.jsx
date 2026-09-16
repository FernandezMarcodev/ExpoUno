import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import styles from "./manualUsuario.module.css";

const SECCIONES = [
  {
    titulo: "Crear cuenta e iniciar sesión",
    pasos: [
      "Tocá «Crear cuenta» en el encabezado y completá email, nombre y contraseña.",
      "Tocá «Iniciar sesión» si ya tenés cuenta para volver a entrar.",
      "Tu sesión queda guardada y podés cerrarla con el botón de salir del encabezado.",
    ],
  },
  {
    titulo: "Explorar conciertos",
    pasos: [
      "La lista muestra los conciertos agrupados por lugar, con artista, fecha y hora.",
      "Buscá por artista escribiendo en «Filtrar conciertos» → «Artista».",
      "Tocá el botón «Ver en mapa» de un concierto para centrar el mapa en ese lugar.",
    ],
  },
  {
    titulo: "Buscar por cercanía a tu ubicación",
    pasos: [
      "En los filtros, tocá «Activar ubicación» y aceptá el permiso del navegador.",
      "Ajustá el radio (1 a 100 km) para ver los conciertos cerca de vos.",
      "Tocá «Desactivar ubicación» para volver a ver todos.",
    ],
  },
  {
    titulo: "Ver conciertos en el mapa",
    pasos: [
      "Cada marcador representa un lugar: tocándolo ves los conciertos de ahí.",
      "Usá el selector del mapa (Automático / Claro / Oscuro) para cambiar su estilo.",
      "No hace falta activar la ubicación: el mapa ya muestra todos los conciertos.",
    ],
  },
  {
    titulo: "Seguir artistas y recibir avisos",
    pasos: [
      "Tocá «Seguir» en un concierto para seguir al artista.",
      "La campana de novedades del encabezado muestra los nuevos shows de tus artistas.",
      "Activá las notificaciones tocando la campana de notificaciones y aceptando el permiso.",
    ],
  },
  {
    titulo: "Favoritos, entradas y cómo llegar",
    pasos: [
      "Tocá el corazón para guardar un concierto en «Mis favoritos».",
      "«Entradas» abre la página de compra del show.",
      "«Como llegar» abre Google Maps con la dirección del lugar.",
    ],
  },
];

const ManualUsuario = ({ abierto, alCerrar }) => {
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (evento) => {
      if (evento.key === "Escape") alCerrar();
    };
    document.addEventListener("keydown", alTecla);
    return () => document.removeEventListener("keydown", alTecla);
  }, [abierto, alCerrar]);

  if (!abierto) return null;

  return (
    <div className={styles.envoltura} onClick={alCerrar} role="dialog" aria-modal="true" aria-label="Cómo usar Concierto Finder">
      <div className={styles.modal} onClick={(evento) => evento.stopPropagation()}>
        <div className={styles.cabecera}>
          <h2 className={styles.titulo}>¿Cómo usar Concierto Finder?</h2>
          <button className={styles.botonCerrar} onClick={alCerrar} aria-label="Cerrar manual" title="Cerrar">
            <FaTimes className={styles.iconoCerrar} />
          </button>
        </div>

        <div className={styles.cuerpo}>
          {SECCIONES.map((seccion) => (
            <section key={seccion.titulo} className={styles.seccion}>
              <h3 className={styles.tituloSeccion}>{seccion.titulo}</h3>
              <ol className={styles.listaPasos}>
                {seccion.pasos.map((paso, indice) => (
                  <li key={indice} className={styles.paso}>
                    {paso}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManualUsuario;