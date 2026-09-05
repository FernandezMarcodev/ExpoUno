# Harness de pruebas locales para Concierto Finder.
#
# IMPORTANTE: nunca ejecutarlo contra la BD de producción.
#
# Uso (desde backend/, con el venv activo o con la ruta del python):
#   python test_local.py reset                                  # Trunca conciertos y ubicaciones
#   python test_local.py scrape                                 # Scrapeo completo + mantenimiento
#   python test_local.py verify                                 # Chequea dups, región, conteo (sin scrapear)
#   python test_local.py stale                                  # Insertar concierto vencido y verificar borrado
#   python test_local.py scheduler                              # Verifica el hilo programado (intervalo 1 min, con stub)
#
# Antes de importar back.py hay que apagar el scraper automático para que la
# prueba no lance un scrapeo en background.
import os
import sys
import time

os.environ["KEEP_ALIVE_URL"] = ""
os.environ["RENDER_EXTERNAL_URL"] = ""
os.environ.setdefault("SCRAPER_INTERVALO_MINUTOS", "0")

from datetime import date, datetime, timedelta

import back


def _normalizar(texto):
    return (texto or "").strip().lower()


def _clave(artista, fecha, hora, lugar):
    f = "" if fecha is None else str(fecha)
    h = "" if hora is None else hora.strftime("%H:%M")
    return f"{_normalizar(artista)}|{f}|{h}|{_normalizar(lugar)}"


def reporte():
    with back.app.app_context():
        conciertos = back.Conciertos.query.all()
        data = [
            {
                "artista": c.artista,
                "fecha": c.fecha,
                "hora": c.hora,
                "lugar": (c.ubicacion_ref.nombre if c.ubicacion_ref else ""),
                "coordenadas": (
                    [back.to_shape(c.ubicacion_ref.coordenadas).x, back.to_shape(c.ubicacion_ref.coordenadas).y]
                    if c.ubicacion_ref and c.ubicacion_ref.coordenadas else None
                ),
            }
            for c in conciertos
        ]

        grupos = {}
        for x in data:
            clave = _clave(x["artista"], x["fecha"], x["hora"], x["lugar"])
            grupos.setdefault(clave, []).append(x)

        dups = [g for g in grupos.values() if len(g) > 1]
        fuera = [
            x for x in data
            if not x["coordenadas"] or not back.en_amba(x["coordenadas"][0], x["coordenadas"][1])
        ]

        print("=" * 60)
        print(f"Conciertos guardados : {len(data)}")
        print(f"Grupos únicos       : {len(grupos)}")
        print(f"Duplicados (por artista|fecha|hora|lugar): {len(dups)}")
        if dups:
            for g in dups[:10]:
                print(f"  {len(g)}x {g[0]['artista']} | {g[0]['fecha']} {g[0]['hora']} | {g[0]['lugar']}")
        print(f"Fuera de la región AMBA o sin coordenadas: {len(fuera)}")
        if fuera:
            for x in fuera[:10]:
                print(f"  {x['artista']} | {x['fecha']} | {x['lugar']} | {x['coordenadas']}")
        print(f"Lugares (ubicaciones) : {back.Ubicaciones.query.count()}")
        print("=" * 60)
        return {"total": len(data), "grupos": len(grupos), "dups": len(dups), "fuera": len(fuera)}


def reset():
    with back.app.app_context():
        back.db.session.execute(back.db.text("TRUNCATE conciertos, ubicaciones RESTART IDENTITY CASCADE"))
        back.db.session.commit()
    print("BD local limpiada (conciertos y ubicaciones truncados).")


def scrape():
    print("Ejecutando scrapeo completo... puede tardar varios minutos.")
    with back.app.app_context():
        concertos = back.ejecutar_scrapeo()
    print(f"Parseados: {len(concertos)}. Estado post-mantenimiento:")
    reporte()


def verify():
    with back.app.app_context():
        back.eliminar_fuera_de_amba()
        back.fusionar_ubicaciones()
        back.eliminar_duplicados()
    reporte()


def stale():
    with back.app.app_context():
        punto = back.WKTElement("POINT(-58.457824 -34.680816)", srid=4326)
        old_ubic = back.Ubicaciones(nombre="Lugar de Prueba, CABA", capacidad_total=0, coordenadas=punto)
        back.db.session.add(old_ubic)
        back.db.session.commit()
        vencido = back.Conciertos(
            nombre="Show Pasado",
            artista="Artista Vencido",
            url_evento="https://ejemplo.com/vencido",
            ubicacion=old_ubic.id,
            fecha=date.today() - timedelta(days=1),
            hora=datetime.strptime("20:00", "%H:%M").time(),
        )
        back.db.session.add(vencido)
        back.db.session.commit()
        total_antes = back.Conciertos.query.count()
        eliminados = back.eliminar_conciertos_pasados()
        total_despues = back.Conciertos.query.count()
        print(f"Antes: {total_antes} | eliminados vencidos: {eliminados} | después: {total_despues}")
        assert eliminados == 1 and total_despues == total_antes - 1, "FALLO: limpieza de vencidos"
    print("OK: los conciertos vencidos se borran automáticamente.")


def scheduler():
    # Verifica el disparo periódico SIN hacer un scrapeo real: se reemplaza
    # ejecutar_scrapeo por un stub que cuenta llamadas.
    import threading
    from datetime import datetime as dt

    llamadas = []
    real = back.ejecutar_scrapeo

    def stub():
        llamadas.append(dt.now())
        print(f"[stub scrape a las {dt.now():%H:%M:%S}] (hilo: {threading.current_thread().name})")
        return []

    back.ejecutar_scrapeo = stub
    os.environ["SCRAPER_INTERVALO_MINUTOS"] = "1"
    inicio = dt.now()
    try:
        hilo = threading.Thread(
            target=back.scheduler_scraper,
            daemon=True,
        )
        hilo.start()
        while len(llamadas) < 2 and (dt.now() - inicio).total_seconds() < 90:
            time.sleep(1)
        print(f"Cantidad de scrapes disparados por el scheduler en {(dt.now() - inicio).total_seconds():.0f}s: {len(llamadas)}")
        assert len(llamadas) >= 2, "FALLO: el scheduler no ejecutó el scrapeo programado"
        print("OK: el scrapeo programado se dispara al inicio y cada intervalo.")
    finally:
        back.ejecutar_scrapeo = real


if __name__ == "__main__":
    sys.argv = sys.argv[1:] or ["verify"]
    {
        "reset": reset,
        "scrape": scrape,
        "verify": verify,
        "stale": stale,
        "scheduler": scheduler,
    }[sys.argv[0]]()