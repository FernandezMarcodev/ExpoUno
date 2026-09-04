# Concierto Finder 🎵

Aplicación web que muestra los próximos conciertos en Buenos Aires y alrededores, permite buscarlos por artista, verlos en un mapa y filtrar por distancia a tu ubicación. Incluye un scraper que se ejecuta automáticamente para mantener los datos actualizados.

## Estructura del proyecto

```
├── backend/          # API Flask + PostgreSQL/PostGIS
│   ├── back.py       # Aplicación (endpoints, scraper, cronjobs)
│   ├── docker-compose.yml  # Base de datos local (PostGIS)
│   ├── .env.example  # Plantilla de variables de entorno
│   └── requirements.txt
└── frontend/         # Aplicación React (Vite) con mapa Leaflet
    ├── src/
    ├── package.json
    └── .env.example  # VITE_API_URL
```

## Requisitos previos

- [Docker](https://www.docker.com/products/docker-desktop/) con Docker Compose (para la base de datos local)
- Python 3.12 o superior
- Node.js 18 o superior + npm

---

## Backend — cómo correrlo

### 1. Levantar la base de datos (PostgreSQL + PostGIS)

Desde la carpeta `backend/`:

```bash
cd backend
docker compose up -d db
```

Esto crea la base local `conciertos` con la extensión **PostGIS** habilitada y un volumen persistente (los datos sobreviven entre reinicios).

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

El `.env` ya trae valores por defecto que funcionan para desarrollo:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `DB_HOST` | `localhost` | Host de la base de datos |
| `DB_PORT` | `5432` | Puerto de PostgreSQL |
| `DB_NAME` | `conciertos` | Nombre de la base |
| `DB_USER` | `conciertos` | Usuario |
| `DB_PASSWORD` | `conciertos_dev` | Contraseña |
| `PORT` | `5000` | Puerto del servidor API |
| `HOST` | `0.0.0.0` | Host donde escucha el servidor |
| `SCRAPER_INTERVALO_MINUTOS` | `360` | Frecuencia del scraper en minutos (`0` = desactivado) |
| `KEEP_ALIVE_URL` | *(vacío)* | URL para ping de mantenimiento; vacío en local |

### 3. Instalar dependencias (entorno virtual recomendado)

Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Linux / macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 4. Iniciar la API

```bash
python back.py
```

Listo: la API queda en `http://localhost:5000`. Al arrancar verifica la extensión PostGIS y crea las tablas automáticamente (idempotente).

### 5. Verificar que funciona

```powershell
# Estado del servicio
Invoke-WebRequest -Uri "http://localhost:5000/" -UseBasicParsing

# Lista de conciertos (vacía hasta el primer scrapeo)
Invoke-WebRequest -Uri "http://localhost:5000/conciertos" -UseBasicParsing

# Conciertos cercanos a una coordenada (lng, lat, km)
Invoke-WebRequest -Uri "http://localhost:5000/conciertos_cerca?lng=-58.4339&lat=-34.6183&km=10" -UseBasicParsing

# Ubicaciones
Invoke-WebRequest -Uri "http://localhost:5000/ubicaciones" -UseBasicParsing
```

### 6. Probar el scraper manualmente

Para cargar conciertos reales desde agendade.com.ar (tarda unos minutos, procesa 5 páginas y geocodifica lugares con Nominatim/OpenStreetMap):

```powershell
Invoke-WebRequest -Uri "http://localhost:5000/scrape_conciertos_agendade" -UseBasicParsing
```

> Requiere conexión a internet. Si el scraper automático está activo (`SCRAPER_INTERVALO_MINUTOS > 0`), esto ocurre solo cada 6 horas.

---

## Frontend — cómo correrlo

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar la URL de la API

```bash
cp .env.example .env
```

Valor por defecto: `VITE_API_URL=http://localhost:5000`. Para apuntar a otra API, cambiá esta variable **antes de** el build o `npm run dev`.

### 3. Levantar el frontend

```bash
npm run dev
```

Abrí la URL que muestra Vite (por ejemplo `http://localhost:5173`). Para producción:

```bash
npm run build      # genera la carpeta dist/
npm run preview    # sirve el build localmente
```

---

## Comportamiento automático del backend

- **Scraper cada 6 horas** (`SCRAPER_INTERVALO_MINUTOS=360`): descarga los conciertos de agendade.com.ar e inserta los nuevos.
- **Limpieza diaria**: un cronjob que corre cada 24 h elimina conciertos pasados y duplicados.
- **Keep alive** (`KEEP_ALIVE_URL`): en producción apunta a la URL del servicio para evitar que duerma. En local va vacío.

---

## Deploy en Render

La app está preparada para hostearse en [Render](https://render.com) con tres servicios. El único trabajo al desplegar es completar las variables de entorno:

1. **Base de datos** → *PostgreSQL*. Al crearla, habilitar PostGIS una vez con `CREATE EXTENSION postgis;` (Render lo soporta en PostgreSQL 13+). Cargar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` en el backend.
2. **Backend** → *Web Service*. Build: `pip install -r requirements.txt`. Start: `python back.py`. Variables: las `DB_*`, `PORT` (la inyecta Render), `SCRAPER_INTERVALO_MINUTOS`, y `KEEP_ALIVE_URL` con la URL pública del servicio (evita el sleep en free tier).
3. **Frontend** → *Static Site*. Build: `npm install && npm run build`. Publish directory: `dist`. Variable de build: `VITE_API_URL` con la URL pública del backend.

> Nota: en el plan gratuito de Render, el backend duerme sin tráfico y el Postgres free expira a los 30 días. Para uso de producción continua conviene planes pagos.