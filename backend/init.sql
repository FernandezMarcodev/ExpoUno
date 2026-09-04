-- Asegura la extensión PostGIS en la base de datos (requerida por ST_DWithin y el tipo Geometry)
CREATE EXTENSION IF NOT EXISTS postgis;