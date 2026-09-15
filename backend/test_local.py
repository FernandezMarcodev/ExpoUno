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
#   python test_local.py borrado_diferido                       # Verifica que el sync borra recién a las 2 corridas
#   python test_local.py coords_null                            # Verifica que venues sin coordenadas no se borran
#   python test_local.py auth                                   # Registro, login y /me (cuentas de usuario)
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


def borrado_diferido():
    # Un concierto ausente en una sola corrida NO se borra; recién con 2 corridas.
    with back.app.app_context():
        back.db.session.execute(back.db.text("TRUNCATE conciertos, ubicaciones RESTART IDENTITY CASCADE"))
        back.db.session.commit()
        punto = back.WKTElement("POINT(-58.457824 -34.680816)", srid=4326)
        v1 = back.Ubicaciones(nombre="Venue Sync Test", capacidad_total=0, coordenadas=punto)
        v2 = back.Ubicaciones(nombre="Venue Sync Test 2", capacidad_total=0, coordenadas=punto)
        back.db.session.add_all([v1, v2])
        back.db.session.commit()
        c1 = back.Conciertos(
            nombre="Show 1", artista="Artista A", url_evento="https://e.com/1", ubicacion=v1.id,
            fecha=date.today() + timedelta(days=30), hora=datetime.strptime("20:00", "%H:%M").time())
        c2 = back.Conciertos(
            nombre="Show 2", artista="Artista B", url_evento="https://e.com/2", ubicacion=v2.id,
            fecha=date.today() + timedelta(days=30), hora=datetime.strptime("21:00", "%H:%M").time())
        back.db.session.add_all([c1, c2])
        back.db.session.commit()
        claves = {back._clave_concierto("Artista A", c1.fecha, c1.hora, "Venue Sync Test")}
        back.eliminar_conciertos_ausentes(claves)
        total_tras_1 = back.Conciertos.query.count()
        assert total_tras_1 == 2, f"FALLO run 1: {total_tras_1} (esperado 2)"
        print(f"Tras 1 corrida ausente: {total_tras_1} conciertos (sin borrado, esperado).")
        back.eliminar_conciertos_ausentes(claves)
        total_tras_2 = back.Conciertos.query.count()
        assert total_tras_2 == 1, f"FALLO run 2: {total_tras_2} (esperado 1)"
    print("OK: borrado diferido — se borra recién tras 2 corridas ausentes.")


def coords_null():
    # Un concierto con venue sin coordenadas NO debe borrarse como "fuera de AMBA".
    with back.app.app_context():
        back.db.session.execute(back.db.text("TRUNCATE conciertos, ubicaciones RESTART IDENTITY CASCADE"))
        back.db.session.commit()
        v = back.Ubicaciones(nombre="Venue Sin Coordenadas", capacidad_total=0, coordenadas=None)
        back.db.session.add(v)
        back.db.session.commit()
        c = back.Conciertos(
            nombre="Show", artista="Artista", url_evento="https://e.com", ubicacion=v.id,
            fecha=date.today() + timedelta(days=30), hora=datetime.strptime("20:00", "%H:%M").time())
        back.db.session.add(c)
        back.db.session.commit()
        back.eliminar_fuera_de_amba()
        queda = back.Conciertos.query.count()
        venue_queda = back.Ubicaciones.query.count()
        assert queda == 1, f"FALLO coords_null: quedaron {queda} conciertos (esperado 1)"
        assert venue_queda == 1, f"FALLO coords_null: quedaron {venue_queda} venues (esperado 1)"
    print("OK: conciertos/venues sin coordenadas no se borran.")


def auth():
    # Registro, login, /me, validaciones y duplicados. Usa el test client de Flask
    # (no levanta servidor). Se ataca a una cuenta de prueba única.
    import uuid
    cliente = back.app.test_client()
    email = f"test_{uuid.uuid4().hex[:10]}@prueba.com"

    # Registro exitoso
    r = cliente.post("/registro", json={"email": email, "nombre": "Usuario Test", "password": "Clave9!secreta"})
    assert r.status_code == 201, f"registro ok: {r.status_code} {r.get_data(as_text=True)}"
    datos = r.get_json()
    assert datos["token"] and datos["usuario"]["email"] == email
    assert datos["usuario"]["nombre"] == "Usuario Test"
    print("OK registro: 201 con token y usuario.")

    # Duplicado -> 409
    r = cliente.post("/registro", json={"email": email.upper(), "nombre": "Otro", "password": "Clave9!secreta"})
    assert r.status_code == 409, f"duplicado: {r.status_code}"
    print("OK registro duplicado: 409 (email normaliza a minúsculas).")

    # Password débil -> 400
    r = cliente.post("/registro", json={"email": "x@x.com", "nombre": "X", "password": "corta"})
    assert r.status_code == 400, f"password debil: {r.status_code}"
    assert "La contraseña debe" in r.get_json()["error"]
    print("OK password débil: 400 con detalle.")

    # Login correcto
    r = cliente.post("/login", json={"email": email, "password": "Clave9!secreta"})
    assert r.status_code == 200, f"login ok: {r.status_code} {r.get_data(as_text=True)}"
    token = r.get_json()["token"]
    assert token
    print("OK login: 200 con token.")

    # Login con password incorrecto -> 401
    r = cliente.post("/login", json={"email": email, "password": "ClaveEquivocada1!"})
    assert r.status_code == 401
    print("OK login incorrecto: 401.")

    # Login con email inexistente -> 401 (mismo mensaje genérico)
    r = cliente.post("/login", json={"email": "no_existe@prueba.com", "password": "Clave9!secreta"})
    assert r.status_code == 401
    assert "incorrectos" in r.get_json()["error"]
    print("OK login email inexistente: 401 genérico.")

    # /me sin token -> 401
    r = cliente.get("/me")
    assert r.status_code == 401
    print("OK /me sin token: 401.")

    # /me con token -> perfil
    r = cliente.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, f"/me: {r.status_code}"
    assert r.get_json()["id"] == datos["usuario"]["id"]
    print("OK /me con token: perfil correcto.")

    # /me con token corrupto -> 401
    r = cliente.get("/me", headers={"Authorization": "Bearer token-invalido"})
    assert r.status_code == 401
    print("OK /me token inválido: 401.")


if __name__ == "__main__":
    sys.argv = sys.argv[1:] or ["verify"]
    {
        "reset": reset,
        "scrape": scrape,
        "verify": verify,
        "stale": stale,
        "scheduler": scheduler,
        "borrado_diferido": borrado_diferido,
        "coords_null": coords_null,
        "auth": auth,
    }[sys.argv[0]]()