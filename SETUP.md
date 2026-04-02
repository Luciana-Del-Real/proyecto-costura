# Proyecto Costura - Guía de Setup Completa

## 🎯 Descripción General

Proyecto full-stack de plataforma de cursos de costura con:
- **Frontend**: React 19 + Tailwind CSS + React Router
- **Backend**: NestJS + TypeScript + Prisma ORM + PostgreSQL
- **Autenticación**: JWT con Passport.js
- **Base de Datos**: PostgreSQL 15

## 📋 Requisitos Previos

### Instalación de Software
- **Node.js** v18+ (https://nodejs.org/)
- **npm** v9+ (incluido con Node)
- **PostgreSQL** 15+ ORE **Docker** para PostgreSQL

Verificar instalación:
```bash
node --version    # Debería ser v18+
npm --version     # Debería ser v9+
```

## 🔧 Setup Paso a Paso

### Paso 1: Clonar / Descargar el Proyecto

```bash
# Si está en OneDrive/Escritorio/Proyecto-Kiro
cd "C:\Users\lucia\OneDrive\Escritorio\Proyecto-Kiro"
```

### Paso 2: Setup del Backend

```bash
cd backend

# 2.1 Instalar dependencias
npm install

# 2.2 Copiar archivo de variables de entorno
cp .env.example .env

# 2.3 Verificar BD PostgreSQL
# Opción A: Con Docker
docker-compose up -d

# Opción B: PostgreSQL local
# Editar .env con tus credenciales de PostgreSQL

# 2.4 Sincronizar base de datos
npm run db:push

# 2.5 Crear usuario admin
npm run db:seed
```

**Credenciales Admin Defecto:**
- Email: `admin@costura.app`
- Password: `Admin123!`

### Paso 3: Setup del Frontend

```bash
cd ../costura-app

# 3.1 Instalar dependencias
npm install

# 3.2 Crear archivo .env.local (opcional, si lo necesitas)
# Por defecto usa http://localhost:3000/api
```

## 🚀 Ejecutar la Aplicación

### Opción A: Dos Terminales (Recomendado)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
- Backend disponible en: `http://localhost:3000/api`
- Prisma Studio: `http://localhost:5555`

**Terminal 2 - Frontend:**
```bash 
cd costura-app
npm run dev
```
- Frontend disponible en: `http://localhost:5173`

### Opción B: Una Terminal (Backend en Background)

```bash
cd backend
npm run dev &
cd ../costura-app
npm run dev
```

## 📝 Flujo de Prueba

### 1. Crear Cuenta de Usuario

1. Abrir http://localhost:5173
2. Ir a "Registrarse"
3. Llenar datos: nombre, email, contraseña
4. Redirige a home si es exitoso

### 2. Como Usuario Normal

1. Ver catálogo de cursos en la página de inicio
2. Hacer clic en un curso → "/courses/:id"
3. Hacer clic en "Comprar" → "/checkout"
4. Ver instrucciones de transferencia y "Solicitar acceso"
5. Ver "Solicitud en revisión" cuando está pendiente

### 3. Como Admin

1. Login con: admin@costura.app / Admin123!
2. Ir al panel admin → "/admin"
3. En "Ventas" ver "Solicitudes pendientes de pago"
4. Hacer clic en "Aprobar" → compra cambia a APPROVED
5. Usuario recibe notificación
6. Usuario ahora puede ver "Continuar" en el curso

### 4. Ver Progreso de Lecciones

1. Loguearse como usuario con curso comprado
2. Entrar a un curso → "/cursos/:id"
3. Primera lección está disponible
4. Hacer clic en "Completar lección"
5. Segunda lección se desbloquea
6. Barra de progreso se actualiza (% completado)

## 🗂️ Estructura de Directorios

```
Proyecto-Kiro/
│
├── backend/                    # NestJS Backend
│   ├── src/
│   │   ├── auth/              # Módulo de autenticación
│   │   ├── courses/           # Módulo de cursos
│   │   ├── lessons/           # Módulo de lecciones  
│   │   ├── purchases/         # Módulo de compras
│   │   ├── users/             # Módulo de usuarios
│   │   ├── favorites/         # Módulo de favoritos
│   │   ├── notifications/     # Módulo de notificaciones
│   │   ├── lesson-progress/   # Módulo de progreso
│   │   ├── prisma/            # BD y ORM
│   │   ├── main.ts            # Entry point
│   │   └── app.module.ts      # Root module
│   ├── prisma/
│   │   ├── schema.prisma      # Esquema de BD
│   │   └── seed.ts            # Script de seeding
│   ├── .env.example           # Variables de entorno
│   ├── package.json
│   └── README.md              # Documentación backend
│
├── costura-app/               # React Frontend
│   ├── src/
│   │   ├── pages/             # Páginas principales
│   │   │   ├── Home.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MyCourses.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── admin/
│   │   ├── components/        # Componentes
│   │   ├── context/           # Estado global
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # Cliente API
│   │   └── App.jsx
│   ├── package.json
│   └── README.md              # Documentación frontend
│
├── ARQUITECTURA.md            # Documentación técnica
├── ENDPOINTS.md              # Referencia de API
└── SETUP.md                  # Este archivo
```

## 📚 Documentación Principal

- **ARQUITECTURA.md** - Descripción completa de arquitectura, flujos, modelos
- **backend/README.md** - Setup detallado del backend
- **backend/ENDPOINTS.md** - Referencia completa de endpoints
- **costura-app/README.md** - Setup detallado del frontend

## 🔑 Variables de Entorno

### Backend (.env)

```env
# Base de datos
DATABASE_URL="postgresql://costura_user:costura_password@localhost:5432/costura_db"

# JWT
JWT_SECRET="tu-secreto-super-seguro-cambia-en-prod"
JWT_EXPIRATION="24h"

# Servidor
NODE_ENV="development"
PORT=3000
API_PREFIX="/api"

# CORS
CORS_ORIGIN="http://localhost:5173"

# Admin seed
ADMIN_EMAIL="admin@costura.app"
ADMIN_PASSWORD="Admin123!"
```

Si usas PostgreSQL local en lugar de Docker, actualiza DATABASE_URL con tus credenciales.

## 🗄️ Gestión de Base de Datos

### Ver/Editar Datos

```bash
cd backend
npm run db:studio
```
Abre http://localhost:5555 en el navegador.

### Crear Migración (después de cambiar schema)

```bash
npm run db:migrate
```

### Reset de BD (⚠️ Borra todo)

```bash
npm run db:reset
```

## 🧪 Testing Manual

### Crear Usuario Alumno
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@costura.app",
    "password": "Admin123!"
  }'
```

### Obtener Cursos
```bash
curl http://localhost:3000/api/courses
```

## 🐛 Troubleshooting

### Error: "ENOTFOUND localhost" o "Connection refused"

**Problema**: Backend no está corriendo
```bash
# Solución: Ir a otra terminal y ejecutar
cd backend
npm run dev
```

### Error: "Cannot GET /api/courses"

**Problema**: Frontend intentando conectar a backend que no está disponible
```bash
# Solución: Backend debe estar en puerto 3000
# Verificar que el backend está corriendo: http://localhost:3000/api
```

### Error: "Database connection failed"

**Problema**: PostgreSQL no está disponible
```bash
# Solución A: Con Docker
docker-compose up -d

# Solución B: Verificar que PostgreSQL está corriendo
# En Windows: Services → PostgreSQL
# En Mac: System Preferences → PostgreSQL
```

### Error: "npm ERR! code ENOENT"

**Problema**: node_modules no instalados
```bash
# Solución
npm install
```

### Build falla con errores de TypeScript

**Problema**: Cambios en el código que no compilan
```bash
# Solución: Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 📊 Arquitectura de Datos

### User (Usuarios)
- id, email (único), nombre, contraseña hasheada
- role: ADMIN o ALUMNO

### Course (Cursos)
- id, título, descripción, precio, nivel
- Relaciones: lecciones, compras, favoritos

### Lesson (Lecciones)
- id, título, videoUrl, duración, orden
- Único por (curso, orden) - No se pueden duplicar

### Purchase (Compras)
- id, usuario, curso, status (PENDING/APPROVED/REJECTED)
- Único por (usuario, curso) - Un usuario compra una vez por curso

### LessonProgress (Progreso)
- id, usuario, lección, completed (boolean)
- Único por (usuario, lección)

### Favorite (Favoritos)
- id, usuario, curso
- Único por (usuario, curso)

### Notification (Notificaciones)
- id, usuario, título, mensaje, leída (boolean)

## 🔒 Seguridad Implementada

✅ **Passwords**: Hasheadas con bcrypt 12-round
✅ **JWT**: Expiración 24 horas
✅ **CORS**: Restringido solo a localhost:5173
✅ **Helmet**: Headers HTTP defensivos
✅ **Rate Limiting**: 100 requests por 15 minutos
✅ **Input Validation**: DTOs validan todas las entradas
✅ **SQL Injection Prevention**: Prisma ORM (no SQL raw)

## 📱 Rutas Frontend Principales

| Ruta | Descripción | Auth |
|------|-------------|------|
| / | Home | ❌ |
| /cursos | Catálogo de cursos | ❌ |
| /cursos/:id | Detalle de curso | ❌ |
| /checkout | Solicitud de compra | ✅ |
| /mis-cursos | Mis cursos comprados | ✅ |
| /favoritos | Mis favoritos | ✅ |
| /perfil | Perfil del usuario | ✅ |
| /login | Login | ❌ |
| /registro | Registro | ❌ |
| /admin | Panel admin | ✅👨‍💼 |
| /admin/cursos | Gestión de cursos | ✅👨‍💼 |
| /admin/ventas | Aprobación de compras | ✅👨‍💼 |

(✅ = requiere login, 👨‍💼 = requiere role ADMIN)

## 📡 Flujo de Datos Principal

```
USUARIO ALUMNO
├── Registrarse/Login → AuthContext
├── Ver cursos → API GET /courses
├── Solicitar compra → API POST /purchases
├── Esperar aprobación → Notification
├── Entrar a curso → API GET /progress/courses/:id
└── Completar lecciones → API PATCH /progress/lessons/:id

USUARIO ADMIN
├── Login → AuthContext
├── CRUD de cursos → API [GET/POST/PUT/DELETE] /courses
├── CRUD de lecciones → API [GET/POST/PUT/DELETE] /courses/:id/lessons
├── Ver solicitudes → API GET /purchases/pending
├── Aprobar/Rechazar → API PATCH /purchases/:id/[approve|reject]
└── Ver usuarios → API GET /users
```

## 🎯 Próximos Pasos (Futuro)

1. **Testing**: Agregar tests automatizados (Jest + Supertest)
2. **Payments**: Integrar Stripe o MercadoPago
3. **Email**: Enviar notificaciones por email
4. **Búsqueda**: Elasticsearch para búsqueda avanzada
5. **WebSockets**: Notificaciones en tiempo real
6. **Analytics**: Tracking de progreso de estudiantes

## 📞 Soporte

Si hay problemas:

1. Verificar que ambos (backend y frontend) están corriendo
2. Revisar la consola del navegador (F12) para errores
3. Revisar la consola del backend para logs
4. Ver `ENDPOINTS.md` para referencias de API
5. Ver `backend/README.md` para más help del backend

## 🎓 Notas de Arquitectura

- **TypeScript**: Stricto en backend (`strict: true`)
- **SOLID**: Módulos desacoplados con Dependency Injection
- **Clean Code**: Separación de concerns (Service → Controller)
- **Security First**: Zero Trust principle en toda la app
- **ORM**: Prisma para type-safety en queries
- **DTOs**: Validación en entrada de datos

---

**Status**: MVP Completo
**Última actualización**: Enero 2024
**Próxima fase**: Integración full + Testing
