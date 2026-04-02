# 🚀 Configuración de PostgreSQL - Proyecto Kiro

## ✅ Cambios ya realizados:

- ✅ Backend configurado para usar PostgreSQL
- ✅ `schema.prisma` actualizado a PostgreSQL
- ✅ Variables de entorno actualizadas en `.env`
- ✅ Backend compilado y listo

## 📋 Pasos para completar la configuración:

### 1️⃣ Instalar PostgreSQL

#### **Opción A: Descargar e instalar PostgreSQL (Recomendado)**

1. Ve a: https://www.postgresql.org/download/windows/
2. Descarga PostgreSQL 16 (o la versión más reciente)
3. Ejecuta el instalador
4. Durante la instalación:
   - **Puerto**: 5432 (por defecto, déjalo así)
   - **Usuario**: `postgres`
   - **Contraseña**: `postgres`
   - **Superuser password**: `postgres`
5. Completa la instalación

#### **Opción B: Si usas XAMPP con PostgreSQL**

Verifica que PostgreSQL esté corriendo:
- Puerto: 5432
- Usuario: postgres
- Contraseña: postgres

### 2️⃣ Crear la base de datos

Después de instalar PostgreSQL, tienes dos opciones:

**Opción A: Usando pgAdmin (GUI - Más fácil)**
1. Abre pgAdmin (se instala con PostgreSQL)
2. Inicia sesión con las credenciales que usaste en la instalación
3. Click derecho en **Databases** → **Create** → **Database**
4. **Database name**: `costura_app`
5. Click **Save**

**Opción B: Usando terminal (psql)**
1. Abre PowerShell o CMD
2. Conecta a PostgreSQL:
   ```bash
   psql -U postgres
   ```
3. Ingresa la contraseña: `postgres`
4. Ejecuta:
   ```sql
   CREATE DATABASE costura_app;
   ```
5. Verifica:
   ```sql
   \l
   ```
6. Salir:
   ```sql
   \q
   ```

### 3️⃣ Sincronizar la base de datos con Prisma

Una vez que PostgreSQL y la base de datos estén creados:

```bash
cd backend
npm run db:push
npm run db:seed
```

### 4️⃣ Verificar que todo funciona

```bash
npm start
```

El backend debería iniciar en http://localhost:3000

### 5️⃣ Prueba de login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@costura.app","password":"Admin123!"}'
```

## 🔍 Solucionar problemas:

### Error: "connect ECONNREFUSED 127.0.0.1:5432"
→ PostgreSQL no está corriendo o no está instalado
→ Instala PostgreSQL siguiendo los pasos arriba

### Error: "role 'postgres' does not exist"
→ El usuario `postgres` no existe
→ Crea el usuario durante la instalación de PostgreSQL

### Error: "database 'costura_app' does not exist"
→ Crea la base de datos siguiendo el paso 2️⃣

## 📝 Configuración actual del `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/costura_app"
```

Si cambias el usuario o contraseña de PostgreSQL, actualiza esta línea en `backend/.env`.

---

**¿Necesitas más ayuda?** Avísame cuando tengas PostgreSQL instalado y corriendo. 🚀
