export function agruparPorPunto(conciertos) {
  const grupos = new Map();
  const sueltos = [];

  for (const concierto of conciertos) {
    const coordenadas = concierto.ubicacion_detalle?.coordenadas;
    if (!coordenadas || coordenadas.length !== 2) {
      sueltos.push(concierto);
      continue;
    }
    const clave = `${coordenadas[1]},${coordenadas[0]}`;
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        lat: coordenadas[1],
        lng: coordenadas[0],
        ubicacion_detalle: concierto.ubicacion_detalle,
        conciertos: [],
      });
    }
    grupos.get(clave).conciertos.push(concierto);
  }

  const agrupados = Array.from(grupos.values()).map((grupo) => {
    grupo.conciertos.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
    return grupo;
  });

  return [...agrupados, ...sueltos.map((concierto) => ({ conciertos: [concierto] }))];
}