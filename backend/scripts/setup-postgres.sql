-- Script para crear la base de datos y usuario en PostgreSQL
-- Ejecuta esto en pgAdmin o psql después de instalar PostgreSQL

-- Crear el usuario (si no existe)
-- En psql: CREATE ROLE postgres WITH LOGIN PASSWORD 'postgres' CREATEDB;

-- Crear la base de datos
CREATE DATABASE costura_app
  OWNER postgres
  ENCODING 'UTF8'
  LC_COLLATE 'C'
  LC_CTYPE 'C'
  TEMPLATE template0;

-- Conectarse a la base de datos
\c costura_app

-- Las migraciones de Prisma se crearán automáticamente
-- cuando ejecutes: npm run db:push
