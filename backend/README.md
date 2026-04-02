# Costura API - Backend

Backend NestJS para la plataforma de cursos Costura con autenticación JWT, gestión de compras interactivas y progreso de lecciones.

## Stack Técnico

- **Framework**: NestJS 10
- **Lenguaje**: TypeScript 5.3
- **Base de Datos**: PostgreSQL 15
- **ORM**: Prisma 5
- **Autenticación**: JWT + Passport.js
- **Validación**: class-validator
- **Seguridad**: Helmet, CORS, Rate Limiting, bcrypt

## Configuración Inicial

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copiar `.env.example` a `.env` y configura:

```bash
cp .env.example .env
```

Para desarrollo local con Docker:

```bash
# Opcionalidad: sin docker necesitas PostgreSQL instalado localmente
docker-compose up -d
```

### 3. Sincronizar Base de Datos

```bash
# Crear schema en BD
npm run db:push

# (Opcional) Crear usuario admin
npm run db:seed
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000/api`.

## Estructura del Proyecto

```
src/
├── main.ts                 # Entry point con middleware de seguridad
├── app.module.ts          # Root module
├── auth/                  # Autenticación (JWT, Guards, Strategies)
├── users/                 # Gestión de usuarios (CRUD)
├── courses/               # Gestión de cursos
├── lessons/               # Gestión de lecciones dentro de cursos
├── purchases/             # Flujo de compra con aprobación manual
└── prisma/                # Conexión y servicios de BD

prisma/
├── schema.prisma          # Definición de modelos
└── seed.ts               # Script para seed de datos
```

## Modelos de Datos

### User
- id, email (unique), name, password (bcrypt), role (ADMIN|ALUMNO)
- Relaciones: purchases, lesson_progress, favorites, notifications

### Course
- id, title, description, price, level, image, featured, active
- Relaciones: lessons, purchases, favorites

### Lesson
- id, title, videoUrl, duration, order, courseId
- Unique constraint: (courseId, order) para evitar duplicados

### Purchase
- id, userId, courseId, status (PENDING|APPROVED|REJECTED), total
- Unique constraint: (userId, courseId) - una compra por usuario por curso
- Workflow: Usuario solicita → PENDING → Admin aprueba/rechaza → APPROVED/REJECTED

### LessonProgress
- id, userId, lessonId, completed (boolean)
- Tracks cuáles lecciones ha completado cada usuario

### Favorite
- id, userId, courseId
- Cursos marcados como favoritos por usuario

### Notification
- id, userId, title, message, read
- Sistema de notificaciones para usuarios

## Autenticación

### Flujo de Registro
```
POST /api/auth/register
{
  "name": "Usuario",
  "email": "user@example.com",
  "password": "Password123!"
}
→ Responde con JWT token
```

### Flujo de Login
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}
→ Responde con JWT token (24h expiration)
```

### Rutas Protegidas
Incluir en header:
```
Authorization: Bearer <JWT_TOKEN>
```

## Endpoints Principales

### Cursos
- `GET /api/courses` - Listar cursos (público)
- `GET /api/courses?featured=true` - Solo cursos destacados
- `GET /api/courses/:id` - Detalle de curso
- `POST /api/courses` - Crear curso (AdminGuard)
- `PUT /api/courses/:id` - Actualizar curso (AdminGuard)
- `DELETE /api/courses/:id` - Eliminar curso (AdminGuard)

### Lecciones
- `GET /api/courses/:courseId/lessons` - Listar lecciones de curso
- `GET /api/courses/:courseId/lessons/:id` - Detalle de lección
- `POST /api/courses/:courseId/lessons` - Crear lección (AdminGuard)
- `PUT /api/courses/:courseId/lessons/:id` - Actualizar lección (AdminGuard)
- `DELETE /api/courses/:courseId/lessons/:id` - Eliminar lección (AdminGuard)

### Compras
- `POST /api/purchases` - Solicitar compra (usuario autenticado)
- `GET /api/purchases/pending` - Ver solicitudes pendientes (AdminGuard)
- `PATCH /api/purchases/:id/approve` - Aprobar compra (AdminGuard)
- `PATCH /api/purchases/:id/reject` - Rechazar compra (AdminGuard)
- `GET /api/purchases/user/:userId` - Compras del usuario

### Usuarios
- `GET /api/users` - Listar usuarios (AdminGuard)
- `GET /api/users/:id` - Detalle de usuario
- `DELETE /api/users/:id` - Eliminar usuario (AdminGuard)

## Seguridad Implementada

✅ **Passwords**: Hasheadas con bcrypt 12-round  
✅ **JWT**: Expiración 24h, firma con secret  
✅ **Zero Trust**: Validación rigurosa de tokens  
✅ **Helmet**: Headers HTTP defensivos  
✅ **CORS**: Restringido a http://localhost:5173  
✅ **Rate Limiting**: 100 requests por 15 minutos  
✅ **Input Validation**: DTOs con class-validator  
✅ **SQL Injection Prevention**: Prisma ORM (no raw SQL)

## Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/db

# JWT
JWT_SECRET=<random-secret-key>
JWT_EXPIRATION=24h

# Servidor
PORT=3000
NODE_ENV=development
API_PREFIX=/api

# CORS
CORS_ORIGIN=http://localhost:5173

# Admin seed (para script de inicialización)
ADMIN_EMAIL=admin@costura.app
ADMIN_PASSWORD=Admin123!
```

## Scripts Disponibles

```bash
npm run dev              # Modo desarrollo con watch
npm run build           # Compilar a JavaScript
npm start               # Ejecutar versión compilada
npm run db:push         # Sincronizar schema con BD
npm run db:studio       # Abrir Prisma Studio UI
npm run db:seed         # Crear usuario admin inicial
npm run db:migrate      # Crear y aplicar migración
npm run lint            # Linter con ESLint
npm run typecheck       # Verificar tipos TypeScript
```

## Debugging

### Prisma Studio
Ver y editar datos visualmente:
```bash
npm run db:studio
```

### Logs de SQL
Habilitar en `.env`:
```env
DATABASE_URL="postgresql://...?schema=public&log=query"
```

## Deployment

### Preparar para producción
```bash
npm run build
npm start
```

### Variables a configurar en producción
- `JWT_SECRET` - Usar valor seguro generado aleatoriamente
- `DATABASE_URL` - Base de datos productiva
- `NODE_ENV` - Cambiar a "production"
- `CORS_ORIGIN` - Actualizar a dominio de producción

## Troubleshooting

**Error: Connection refused (DB connection)**
→ Verificar que PostgreSQL está corriendo: `docker-compose up -d`

**Error: Invalid JWT token**
→ Token expirado (24h) o secret mal configurado

**Error: Unique constraint failed**
→ Intentar crear recurso duplicado. Verificar (userId, courseId) para purchases

**Error: NestJS compilation failed**
→ Ejecutar `npm run typecheck` para ver errores de TypeScript

## Próximas Mejoras

- [ ] Integración con gateway de pagos (Stripe, MercadoPago)
- [ ] Sistema de notificaciones real-time (WebSockets)
- [ ] Verificación de email al registrarse
- [ ] Rate limiting por usuario (no global)
- [ ] Logs centralizados (Winston, ELK)
- [ ] Testing automatizado (Jest, e2e)
- [ ] Documentación OpenAPI (Swagger)
