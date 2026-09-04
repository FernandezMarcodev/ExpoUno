from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry, WKTElement
from sqlalchemy.dialects.postgresql import BOOLEAN, DATE, TIME
from geoalchemy2.shape import to_shape
from sqlalchemy import func, and_
from flask import request
from markupsafe import escape
import requests
from bs4 import BeautifulSoup
import time
from typing import List, Dict
import json
from datetime import datetime, date
import threading
from flask_cors import CORS
from sqlalchemy.exc import TimeoutError
from flask import jsonify
from sqlalchemy.orm import joinedload
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

import sys
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuración de la base de datos desde variables de entorno
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "conciertos")
DB_USER = os.getenv("DB_USER", "conciertos")
DB_PASSWORD = os.getenv("DB_PASSWORD", "conciertos")
DB_SSLMODE = os.getenv("DB_SSLMODE", "")

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://{DB_USER}:{quote_plus(DB_PASSWORD)}@"
    f"{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
if DB_SSLMODE:
    app.config['SQLALCHEMY_DATABASE_URI'] += f"?sslmode={DB_SSLMODE}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# CONFIGURACIÓN DEL POOL - Esto es lo importante
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 3,           # Máximo 3 conexiones en el pool
    'max_overflow': 2,        # Permite 2 conexiones extra temporales (total: 5)
    'pool_timeout': 30,       # Espera 30 segundos antes de error
    'pool_recycle': 1800,     # Recicla conexiones cada 30 min
    'pool_pre_ping': True     # Verifica que la conexión esté viva antes de usarla
}

db = SQLAlchemy(app)

cantidad_conexiones = 0

#modelos de tablas
class Ubicaciones(db.Model):
    __tablename__ = 'ubicaciones'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    capacidad_total = db.Column(db.Integer, nullable=False)
    coordenadas = db.Column(Geometry('POINT', srid=4326))
    url_maps = db.Column(db.String(100))

    conciertos = db.relationship('Conciertos', backref='ubicacion_ref', cascade="all, delete", lazy=True)

class Conciertos(db.Model):
    __tablename__ = 'conciertos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False)
    artista = db.Column(db.String(50), nullable=False)
    url_evento = db.Column(db.String(100))
    ubicacion = db.Column(db.Integer, db.ForeignKey('ubicaciones.id', ondelete='CASCADE'))
    isagotado = db.Column(BOOLEAN, default=False)
    isaptomenores = db.Column(BOOLEAN, default=False)
    fecha = db.Column(DATE)
    hora = db.Column(TIME)

# Al arrancar: asegurar extensión PostGIS y crear tablas si no existen (idempotente)
with app.app_context():
    try:
        db.session.execute(db.text("CREATE EXTENSION IF NOT EXISTS postgis"))
        db.session.commit()
        print("Extensión postgis verificada/creada.")
    except Exception as e:
        print(f"AVISO: no se pudo crear/verificar la extensión postgis: {e}")
        db.session.rollback()
    try:
        db.create_all()
        print("Tablas verificadas/creadas correctamente.")
    except Exception as e:
        print(f"AVISO: no se pudieron crear/verificar las tablas: {e}")
        db.session.rollback()

#rutas
@app.route("/")
def hello_world():
    print("Api funcionando correctamente: 200 OK")
    return "<p>Api funcionando correctamente: 200 OK</p>"

@app.route("/ubicaciones")
def get_ubicaciones():
    print("hola")
    ubicaciones = Ubicaciones.query.all()
    return {
        "ubicaciones": [
            {
                "id": ubicacion.id,
                "nombre": ubicacion.nombre,
                "capacidad_total": ubicacion.capacidad_total,
                "coordenadas": (
                        [to_shape(ubicacion.coordenadas).x, to_shape(ubicacion.coordenadas).y]
                        if ubicacion and ubicacion.coordenadas else None
                    ),
                "url_maps": ubicacion.url_maps
            } for ubicacion in ubicaciones
        ]
    }

@app.route("/conciertos")
def get_conciertos():
    conciertos = Conciertos.query.all()
    return {
        "conciertos": [
            {
                "id": concierto.id,
                "nombre": concierto.nombre,
                "artista": concierto.artista,
                "url_evento": concierto.url_evento,
                "ubicacion": concierto.ubicacion,
                "isAgotado": concierto.isagotado,
                "isAptoMenores": concierto.isaptomenores,
                "fecha": str(concierto.fecha),
                "hora": str(concierto.hora),
                "ubicacion_detalle": {
                    "id": concierto.ubicacion_ref.id if concierto.ubicacion_ref else None,
                    "nombre": concierto.ubicacion_ref.nombre if concierto.ubicacion_ref else None,
                    "capacidad_total": concierto.ubicacion_ref.capacidad_total if concierto.ubicacion_ref else None,
                    "coordenadas": (
                        [to_shape(concierto.ubicacion_ref.coordenadas).x, to_shape(concierto.ubicacion_ref.coordenadas).y]
                        if concierto.ubicacion_ref and concierto.ubicacion_ref.coordenadas else None
                    ),
                    "url_maps": concierto.ubicacion_ref.url_maps if concierto.ubicacion_ref else None
                }
            } for concierto in conciertos
        ]
    }

#ejemplo query desde parque rivadavia /conciertos_cerca?lng=-34.61830362159788&lat=-58.433900393162745&km=10
@app.route("/conciertos_cerca")
def get_conciertos_cerca():
    try:
        lat = float(escape(request.args.get("lat")))
        lng = float(escape(request.args.get("lng")))
        km = float(escape(request.args.get("km")))
    except (TypeError, ValueError):
        return {"error": "Parámetros inválidos"}, 400

    metros = km * 1000

    try:
        global cantidad_conexiones
        cantidad_conexiones = cantidad_conexiones + 1
        if cantidad_conexiones > 5:
            db.session.close_all()
            cantidad_conexiones = 0
            return {"error": "Servidor ocupado, intenta nuevamente en unos segundos."}, 503
        conciertos = db.session.query(Conciertos).join(Ubicaciones).options(joinedload(Conciertos.ubicacion_ref)).filter(
        func.ST_DWithin(
            func.Geography(Ubicaciones.coordenadas),
            func.Geography(func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)),
            metros
        )
    ).all()


        # Serializar DENTRO del try, mientras la sesión está activa
        resultado = {
            "conciertos": [
                {
                    "id": concierto.id,
                    "nombre": concierto.nombre,
                    "artista": concierto.artista,
                    "url_evento": concierto.url_evento,
                    "ubicacion": concierto.ubicacion,
                    "isAgotado": concierto.isagotado,
                    "isAptoMenores": concierto.isaptomenores,
                    "fecha": str(concierto.fecha),
                    "hora": str(concierto.hora),
                    "ubicacion_detalle": {
                        "id": concierto.ubicacion_ref.id if concierto.ubicacion_ref else None,
                        "nombre": concierto.ubicacion_ref.nombre if concierto.ubicacion_ref else None,
                        "capacidad_total": concierto.ubicacion_ref.capacidad_total if concierto.ubicacion_ref else None,
                        "coordenadas": (
                            [to_shape(concierto.ubicacion_ref.coordenadas).x, to_shape(concierto.ubicacion_ref.coordenadas).y]
                            if concierto.ubicacion_ref and concierto.ubicacion_ref.coordenadas else None
                        ),
                        "url_maps": concierto.ubicacion_ref.url_maps if concierto.ubicacion_ref else None
                    }
                } for concierto in conciertos
            ]
        }
        
        return resultado
        
    except Exception as e:
        print(f"Error en la consulta de conciertos cercanos: {str(e)}")
        db.session.rollback()
        return {"error": "Error en la consulta"}, 500
        
    finally:
        db.session.close()  # IMPORTANTE: Siempre cierra la sesión
    


# funcion de scrapeo
def ejecutar_scrapeo() -> List[Dict]:
    url = "https://www.agendade.com.ar/agenda?deb54158_page="
    conciertos = []
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    try:
        for page in range(1, 6):  # Paginación: páginas 1 a 5
            url_base = f"{url}{page}"
            print("procesando pagina "+str(url_base))
            response = requests.get(url_base, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            lista_conciertos = soup.find('div', {
                'fs-cmsload-element': 'list',
                'fs-cmsfilter-element': 'list'
            })
            if not lista_conciertos:
                return conciertos
            items = lista_conciertos.find_all('div', {'role': 'listitem'})
            for idx, item in enumerate(items, 1):
                try:
                    link_element = item.find('a', class_='link-block-11')
                    if not link_element or not link_element.get('href'):
                        continue
                    href = link_element['href']
                    url_concierto = f"https://www.agendade.com.ar{href}" if href.startswith('/') else href
                    time.sleep(1)
                    response_concierto = requests.get(url_concierto, headers=headers)
                    response_concierto.raise_for_status()
                    soup_concierto = BeautifulSoup(response_concierto.content, 'html.parser')
                    info_div = soup_concierto.find('div', class_='div-block-192')
                    if not info_div:
                        continue
                    boton_compra= soup_concierto.find('a', class_='boton-comprar-entradas w-button')
                    url_concierto = boton_compra.get("href")
                    nombre_evento = info_div.get('data-event-title', '')
                    ubicacion_data = info_div.get('data-event-location', '')
                    fecha_data = info_div.get('data-event-date', '')
                    artista = ''
                    ubicacion = ubicacion_data
                    fecha = ''
                    hora = ''
                    bloques_info = info_div.find_all('div', class_='div-block-243')
                    for bloque in bloques_info:
                        titulo = bloque.find('div', class_='titulo-chico')
                        valor = bloque.find('div', class_='titulo-intermedio')
                        if titulo and valor:
                            titulo_texto = titulo.get_text(strip=True).upper()
                            valor_texto = valor.get_text(strip=True)
                            print(titulo_texto)
                            if titulo_texto == 'ARTISTA' or titulo_texto == 'SHOW':
                                if not artista:
                                    artista = valor_texto
                            elif titulo_texto == 'VENUE':
                                ubicacion = valor_texto
                            elif titulo_texto == 'UBICACIÓN':
                                if ubicacion:
                                    ubicacion = f"{ubicacion}, {valor_texto}"
                                else:
                                    ubicacion = valor_texto
                            elif titulo_texto == 'FECHA':
                                fecha = valor_texto
                            elif titulo_texto == 'HORARIO':
                                hora = valor_texto
                    if not artista:
                        artista = nombre_evento
                    concierto_info = {
                        'nombre_evento': nombre_evento,
                        'artista': artista,
                        'url_evento': url_concierto,
                        'ubicacion': ubicacion,
                        'fecha': fecha,
                        'hora': hora
                    }
                    print("concierto de "+nombre_evento)
                    conciertos.append(concierto_info)
                except Exception as e:
                    print(f"Error procesando concierto {idx}: {str(e)}")
                    continue

                # --- AGREGAR A LA BASE DE DATOS ---
                # Buscar la ubicación por nombre usando ilike
                ubicacion_obj = Ubicaciones.query.filter(Ubicaciones.nombre.ilike(f"%{ubicacion}%")).first()
                if not ubicacion_obj:
                    lat, lon = get_coordenadas(ubicacion)
                    # Si no se encuentran coordenadas, no agregar ni ubicación ni concierto
                    if not (lat and lon):
                        print(f"No se encontró ubicación para '{ubicacion}', no se agrega el concierto '{nombre_evento}'")
                        continue
                    # Recuerda: primero longitud, luego latitud
                    punto = WKTElement(f'POINT({lon} {lat})', srid=4326)
                    nueva_ubicacion = Ubicaciones(
                        nombre=ubicacion,
                        capacidad_total=0,
                        coordenadas=punto,
                        url_maps=f'https://www.google.com/maps/search/?api=1&query={lat},{lon}'
                    )
                    db.session.add(nueva_ubicacion)
                    db.session.commit()
                    ubicacion_obj = nueva_ubicacion

                # Parsear fecha y hora
                nueva_fecha = None
                nueva_hora = None
                try:
                    if fecha:
                        # Intenta parsear fecha en formato DD/MM/YYYY o similar
                        ddmmyy = fecha.split(sep='/')
                        nueva_fecha = ('20'+ ddmmyy[2] + '-' + ddmmyy[1] + '-' + ddmmyy[0])
                    if hora:
                        # Intenta parsear hora en formato HH:MM o HH:MM:SS
                        if len(hora.split(":")) == 2:
                            nueva_hora = datetime.strptime(hora, "%H:%M").time()
                        else:
                            nueva_hora = datetime.strptime(hora, "%H:%M:%S").time()
                except Exception:
                    pass

                # Evitar duplicados: omitir si ya existe la misma clave (nombre, fecha, hora, ubicacion)
                try:
                    existente = Conciertos.query.filter(
                        Conciertos.nombre == nombre_evento,
                        Conciertos.fecha == nueva_fecha,
                        Conciertos.hora == nueva_hora,
                        Conciertos.ubicacion == ubicacion_obj.id
                    ).first()
                    if existente:
                        print(f"Ya existe en la BD: '{nombre_evento}' en {nueva_fecha} — se omite")
                        continue
                except Exception as e:
                    print(f"Error al verificar existencia: {e}")
                    continue

                nuevo_concierto = Conciertos(
                    nombre=nombre_evento,
                    artista=artista,
                    url_evento=(url_concierto[:100] if url_concierto else None),
                    ubicacion=ubicacion_obj.id,
                    fecha=nueva_fecha,
                    hora=nueva_hora
                )
                try:
                    db.session.add(nuevo_concierto)
                    db.session.commit()
                except Exception as e:
                    print(f"Error al agregar concierto a la sesión: {str(e)}")
                    db.session.rollback()
                    continue
                finally:
                    db.session.close()
                # ----------------------------------

                
        
        print(f"\n{'='*50}")
        print(f"Total de conciertos extraídos: {len(conciertos)}")
        print(f"{'='*50}")

        # Mantener la base vigente: borrar pasados y duplicados tras cada scrapeo
        eliminar_conciertos_pasados()
        eliminar_duplicados()
        
    except Exception as e:
        print(f"Error al obtener la página principal: {str(e)}")
    
    return conciertos

@app.route("/scrape_conciertos_agendade")
def scrape_conciertos() -> List[Dict]:
    return ejecutar_scrapeo()

def get_coordenadas(location_name):
    """
    Obtiene las coordenadas usando Nominatim de OpenStreetMap (gratuito)
    """
    base_url = "https://nominatim.openstreetmap.org/search"
    
    params = {
        'q': location_name,
        'format': 'json',
        'limit': 1
    }
    
    headers = {
        'User-Agent': 'VenueLocator/1.0'
    }
    
    try:
        response = requests.get(base_url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            lat = data[0]['lat']
            lon = data[0]['lon']
            return lat, lon
        else:
            return None, None
    except Exception as e:
        print(f"Error al obtener coordenadas para {location_name}: {e}")
        return None, None

def keep_alive():
    url = os.getenv("KEEP_ALIVE_URL") or os.getenv("RENDER_EXTERNAL_URL")
    if not url:
        print("keep_alive desactivado (sin KEEP_ALIVE_URL ni RENDER_EXTERNAL_URL).")
        return
    print(f"keep_alive activado hacia {url}")
    while True:
        try:
            response = requests.get(url)
            print(f"Keep alive status: {response.status_code}")
        except Exception as e:
            print(f"Error en keep_alive: {e}")
        time.sleep(12  * 60)  # 12 minutos


@app.errorhandler(TimeoutError)
def handle_db_timeout(e):
    db.session.close()
    return jsonify({"error": "Servidor ocupado, intenta nuevamente en unos segundos."}), 503

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()



def eliminar_conciertos_pasados():
    try:
        hoy = date.today()
        eliminados = db.session.query(Conciertos).filter(Conciertos.fecha < hoy).delete(synchronize_session=False)
        db.session.commit()
        print(f"Limpieza: {eliminados} conciertos pasados eliminados.")
        return eliminados
    except Exception as e:
        print(f"Error al eliminar conciertos pasados: {e}")
        db.session.rollback()
        return 0


def eliminar_duplicados():
    try:
        resultado = db.session.execute(db.text(
            """
            DELETE FROM conciertos a
            USING conciertos b
            WHERE a.id > b.id
              AND a.nombre = b.nombre
              AND a.fecha IS NOT DISTINCT FROM b.fecha
              AND a.hora IS NOT DISTINCT FROM b.hora
              AND a.ubicacion IS NOT DISTINCT FROM b.ubicacion
            """
        ))
        db.session.commit()
        print(f"Limpieza: {resultado.rowcount} duplicados eliminados.")
        return resultado.rowcount
    except Exception as e:
        print(f"Error al eliminar duplicados: {e}")
        db.session.rollback()
        return 0


def cronjob_eliminar_conciertos():
    print("Iniciando cronjob diario de limpieza (pasados + duplicados)...")
    while True:
        try:
            with app.app_context():
                eliminar_conciertos_pasados()
                eliminar_duplicados()
        except Exception as e:
            print(f"Error en cronjob de limpieza: {e}")
            with app.app_context():
                db.session.rollback()
        time.sleep(24 * 60 * 60)  # Espera 24 horas

# Scraper automático: ejecuta el scrapeo cada SCRAPER_INTERVALO_MINUTOS (0 = desactivado)
def scheduler_scraper():
    interval_minutos = int(os.getenv("SCRAPER_INTERVALO_MINUTOS", "360"))
    if interval_minutos <= 0:
        print("Scraper automático desactivado (SCRAPER_INTERVALO_MINUTOS=0).")
        return
    print(f"Scraper automático activado: primer corrido inmediato, luego cada {interval_minutos} minutos.")
    while True:
        try:
            print("Ejecutando scrapeo programado...")
            with app.app_context():
                ejecutar_scrapeo()
        except Exception as e:
            print(f"Error en scrapeo programado: {e}")
        time.sleep(interval_minutos * 60)

# Limpieza inicial al arrancar (pasados + duplicados)
try:
    with app.app_context():
        eliminar_conciertos_pasados()
        eliminar_duplicados()
        print("Limpieza inicial completada.")
except Exception as e:
    print(f"AVISO: limpieza inicial falló: {e}")

# Iniciar procesos en segundo plano al arrancar el servicio
if os.getenv("KEEP_ALIVE_URL") or os.getenv("RENDER_EXTERNAL_URL"):
    threading.Thread(target=keep_alive, daemon=True).start()
if int(os.getenv("SCRAPER_INTERVALO_MINUTOS", "360")) > 0:
    threading.Thread(target=scheduler_scraper, daemon=True).start()
threading.Thread(target=cronjob_eliminar_conciertos, daemon=True).start()

if __name__ == "__main__":
    from waitress import serve
    print("Arrancando servidor Flask con waitress...")
    serve(app, host=os.getenv("HOST", "0.0.0.0"), port=int(os.getenv("PORT", "5000")))



