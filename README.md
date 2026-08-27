# Proyecto Costura — Grow Creative Education Studio

Plataforma de cursos online de costura y manualidades de **Grow Creative Education Studio**, con soporte para alumnas de Argentina (ARS) y Australia (AUD).

Los cursos se venden por transferencia bancaria: la alumna elige el curso, ve los datos de pago según su país, transfiere y envía el comprobante por WhatsApp. El admin aprueba la compra manualmente desde su panel y ahí se habilita el acceso a las clases.

## Stack

- **Backend:** NestJS + Prisma + PostgreSQL
- **Frontend:** React (Vite) + Tailwind
- **Autenticación:** JWT
- **Archivos (imágenes de portada, PDFs de clases):** almacenados en disco en el backend, servidos como archivos estáticos

## Estructura del proyecto

```
proyecto-costura/
├── backend/          # API NestJS
│   ├── src/          # Módulos: auth, users, courses, lessons, purchases,
│   │                 # lesson-progress, favorites, attachments, notifications...
│   ├── prisma/        # schema.prisma, migraciones y seed
│   ├── scripts/       # Scripts de mantenimiento (crear admin, limpiar datos, etc.)
│   └── uploads/       # Imágenes y PDFs subidos por el admin
└── costura-app/       # Frontend React (Vite)
    └── src/
        ├── pages/      # Páginas públicas y de alumno (Home, Cursos, Perfil...)
        ├── pages/admin/# Panel de administración (Dashboard, Cursos, Ventas, Alumnas)
        ├── context/    # AuthContext y CoursesContext (estado global)
        ├── components/ # Navbar, tarjetas de curso, etc.
        └── utils/      # Helpers de moneda (ARS/AUD) y URLs de archivos
```

## Requisitos previos

- Node.js 20 o superior
- PostgreSQL 15 (o Docker, para levantarlo con `docker-compose`)
- npm

## Puesta en marcha (primera vez)

### 1. Base de datos

Si tenés Docker, desde `backend/`:

```bash
docker-compose up -d
```

Esto levanta un PostgreSQL en `localhost:5432` y un Adminer (interfaz web para ver la base) en `localhost:8080`. Si ya tenés PostgreSQL instalado localmente, podés usar ese en su lugar.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Editá `.env` con tus propios valores (ver la sección de variables de entorno más abajo — **especialmente `JWT_SECRET`**, no dejes el de ejemplo).

```bash
npx prisma migrate deploy    # aplica las migraciones a la base
npm run db:seed              # crea el usuario admin inicial
npm run dev                  # levanta la API en http://localhost:3000
```

### 3. Frontend

En otra terminal:

```bash
cd costura-app
npm install
cp .env.example .env   # si no existe .env.example, crealo con VITE_API_URL=http://localhost:3000/api
npm run dev             # levanta la app en http://localhost:5173
```

### 4. Ingresar como admin

Usá el email/contraseña que hayas definido en `ADMIN_EMAIL` / `ADMIN_PASSWORD` en el `.env` del backend antes de correr `db:seed` (por defecto, ver `.env.example`).

## Variables de entorno (backend)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Clave para firmar los tokens de sesión — **usar un valor largo y aleatorio propio, nunca el de ejemplo** |
| `JWT_EXPIRATION` | Duración de la sesión (ej. `24h`) |
| `NODE_ENV` | `development` o `production` |
| `PORT` | Puerto de la API (por defecto `3000`) |
| `API_PREFIX` | Prefijo de las rutas (por defecto `/api`) |
| `CORS_ORIGIN` | Dominio(s) permitidos para llamar a la API, separados por coma |
| `FRONTEND_URL` | Origen público del frontend, usado en los enlaces de los emails (ej. reset de contraseña) |
| `MAIL_ENABLED` | Habilita el envío de email por SendGrid. `"false"` por defecto; poné `"true"` solo si configuraste `SENDGRID_API_KEY` |
| `SENDGRID_API_KEY` | API key de SendGrid — **requerida** cuando `MAIL_ENABLED="true"` (el backend falla al arrancar si falta) |
| `SENDGRID_FROM` | Remitente de los correos transaccionales |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Datos del usuario admin que crea `npm run db:seed` |

## Variables de entorno (frontend)

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL completa de la API, incluyendo `/api` (ej. `http://localhost:3000/api` en desarrollo) |

## Scripts disponibles

### Backend (`backend/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la API en modo desarrollo (con recarga automática) |
| `npm run build` | Compila la API para producción |
| `npm start` | Corre la API ya compilada (`dist/main.js`) |
| `npm run db:migrate` | Crea/aplica una migración de Prisma en desarrollo |
| `npm run db:seed` | Crea el usuario admin inicial |
| `npm run db:create-admin` | Crea un admin adicional (ver `scripts/create-admin.js` para parámetros) |
| `npm run db:studio` | Abre Prisma Studio para ver/editar la base visualmente |
| `npm run lint` | Corre ESLint |
| `npm run typecheck` | Chequea tipos de TypeScript sin compilar |
| `npm test` | Corre los tests Jest (unit + e2e Supertest) |

Además, en `backend/scripts/` hay utilidades manuales (correrlas con `node scripts/<archivo>.js`):
- `create-admin.js` — crear un usuario admin
- `reset-all-except-admin.js` — borra todos los cursos, ventas y usuarios excepto los admins (usar con cuidado, es irreversible)
- `cleanup-non-admin.js`, `create-db.js`, `e2e-reset-flow.js`, `setup-postgres.sql` — utilidades varias de desarrollo

### Frontend (`costura-app/`)

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el frontend en modo desarrollo |
| `npm run build` | Genera el build de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción, para probarlo antes de desplegar |
| `npm run lint` | Corre ESLint |
| `npm test` | Corre los tests Vitest |

## Antes de salir a producción

Este proyecto tiene pendientes varios puntos importantes antes de salir a producción (por ejemplo: reemplazar los datos bancarios de ejemplo para Australia y revisar la configuración de email/SendGrid). Ver el informe de preparación para producción para el detalle completo antes de lanzar.

## Roles de usuario

- **ALUMNO**: se registra eligiendo su país (Argentina o Australia, lo que define en qué moneda ve los precios), navega cursos, solicita la compra y, una vez aprobada por el admin, accede a las clases.
- **ADMIN**: gestiona cursos y lecciones (con PDFs adjuntos), aprueba/rechaza solicitudes de compra, y ve el detalle de alumnas y ventas separado por moneda (ARS/AUD).