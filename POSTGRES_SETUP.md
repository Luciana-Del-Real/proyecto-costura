# 🗄️ Configuración de PostgreSQL para Proyecto Kiro

## Opción 1: Instalar PostgreSQL localmente (Recomendado)

### En Windows:
1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Durante la instalación:
   - Usuario: `postgres`
   - Contraseña: `postgres`
   - Puerto: `5432` (por defecto)
3. Completa la instalación

### Después de instalar PostgreSQL:
1. Abre SQL Shell (psql) o pgAdmin
2. Ejecuta:
```sql
CREATE DATABASE costura_app;
```

## Opción 2: Usar PostgreSQL con XAMPP (si lo tienes instalado)

Si XAMPP incluye PostgreSQL, asegúrate de que esté corriendo en puerto 5432.

## Opción 3: Usar Docker (Alternativa)

Si tienes Docker instalado, ejecuta:
```bash
docker run --name postgres-costura -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=costura_app -p 5432:5432 -d postgres:16
```

## Verificar la conexión:

Después de instalar PostgreSQL, ejecuta en el backend:
```bash
npm run db:push
npm run db:seed
```

## Notas:
- Usuario PostgreSQL: `postgres`
- Contraseña: `postgres`
- Host: `localhost`
- Puerto: `5432`
- Base de datos: `costura_app`

La URL de conexión está en: `backend/.env`
