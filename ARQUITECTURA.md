# Proyecto Costura - Resumen Técnico

## 📋 Resumen Ejecutivo

Plataforma de educación digital para cursos de costura y textil con:
- ✅ Sistema de autenticación JWT seguro
- ✅ Flujo de compra con aprobación manual (sin gateway de pago en MVP)
- ✅ Progresión secuencial de lecciones (debe completar en orden)
- ✅ Sistema de notificaciones automático
- ✅ Panel de administrador para gestión de cursos y aprobaciones
- ✅ Sistema de favoritos

## 🏗️ Arquitectura del Proyecto

```
Proyecto-Kiro/
├── costura-app/              # Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── pages/            # Páginas principales
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Estado global (Auth, Courses, Favorites)
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API client (fetch)
│   │   └── data/             # Datos estáticos
│   └── package.json
│
└── backend/                  # Backend (NestJS + TypeScript)
    ├── src/
    │   ├── main.ts           # Entry point con middleware
    │   ├── app.module.ts     # Root module
    │   ├── auth/             # Autenticación (JWT, Guards, Strategies)
    │   ├── users/            # CRUD de usuarios
    │   ├── courses/          # CRUD de cursos
    │   ├── lessons/          # CRUD de lecciones
    │   ├── purchases/        # Flujo de compra con aprobación
    │   ├── lesson-progress/  # Tracking de lecciones completadas
    │   ├── notifications/    # Sistema de notificaciones
    │   ├── favorites/        # Sistema de favoritos
    │   └── prisma/           # Conexión a BD
    ├── prisma/
    │   ├── schema.prisma     # Definición de modelos (7 modelos)
    │   └── seed.ts           # Script para crear admin
    └── package.json
```

## 🗄️ Modelos de Datos (Prisma)

### 1. **User**
- Almacena usuarios con autenticación
- Roles: ALUMNO, ADMIN
- Relaciones: purchases, lesson_progress, favorites, notifications

### 2. **Course**
- Catálogo de cursos
- Niveles: PRINCIPIANTE, INTERMEDIO, AVANZADO
- Campos: title, description, price, image, instructor, rating, students

### 3. **Lesson**
- Lecciones dentro de cursos
- Ordenadas secuencialmente por curso
- Unique constraint: (courseId, order)

### 4. **LessonProgress**
- Tracking de progreso del estudiante
- Registra qué lecciones completó cada usuario
- Unique constraint: (userId, lessonId)

### 5. **Purchase**
- Solicitudes de compra con estados
- Estados: PENDING → APPROVED/REJECTED
- Unique constraint: (userId, courseId) - una compra por usuario por curso

### 6. **Favorite**
- Cursos marcados como favoritos
- Unique constraint: (userId, courseId)

### 7. **Notification**
- Notificaciones automáticas para usuarios
- Creadas al aprobar/rechazar compras

## 🔐 Seguridad

✅ **Passwords**: Hasheadas con bcrypt (12 rounds)
✅ **JWT**: Token de 24 horas con firma
✅ **CORS**: Restringido a http://localhost:5173
✅ **Helmet**: Headers HTTP defensivos
✅ **Rate Limiting**: 100 requests por 15 minutos
✅ **Input Validation**: DTOs con class-validator
✅ **SQL Injection Prevention**: Prisma ORM (no raw SQL)
✅ **Zero Trust**: Validación rigurosa de tokens y permisos

## 🚀 Configuración Inicial

### Paso 1: Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../costura-app
npm install
```

### Paso 2: Configurar Base de Datos

```bash
cd backend

# Opción A: Con Docker
docker-compose up -d

# Opción B: PostgreSQL manual
# Instalar PostgreSQL 15 y crear BD: costura_db
```

### Paso 3: Variables de Entorno

```bash
# backend/.env
DATABASE_URL="postgresql://costura_user:costura_password@localhost:5432/costura_db"
JWT_SECRET="your-super-secret-key"
JWT_EXPIRATION="24h"
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
ADMIN_EMAIL="admin@costura.app"
ADMIN_PASSWORD="Admin123!"
```

### Paso 4: Sincronizar Base de Datos

```bash
cd backend

# Crear schema
npm run db:push

# Crear usuario admin
npm run db:seed
```

### Paso 5: Ejecutar Aplicación

```bash
# Terminal 1: Backend
cd backend
npm run dev
# En http://localhost:3000/api

# Terminal 2: Frontend
cd costura-app
npm run dev
# En http://localhost:5173
```

## 📊 Flujos Principales

### 1. Registro e Inicio de Sesión
```
Usuario escribe email → BD verifica unicidad → Contraseña hasheada → JWT firmado → Devuelto al cliente
```

### 2. Compra de Curso (Flujo Manual interactivo)
```
Usuario clickea "Comprar" 
→ Redirige a /checkout
→ Muestra instrucciones de transferencia bancaria
→ Usuario hace clic "Solicitar acceso"
→ Purchase creado con status: PENDING
→ Admin recibe notificación
→ Admin ve en AdminSales → Aprueba/Rechaza
→ Si aprueba: Purchase → APPROVED + LessonProgress creados + Notificación al usuario
→ Usuario accede a las lecciones
```

### 3. Progresión de Lecciones (Secuencial)
```
Usuario ve curso → Lecciones bloqueadas
→ Completa lección 1
→ Lección 2 se desbloquea
→ No puede hacer skip
→ Progreso guardado en BD
```

### 4. Notificaciones
```
Admin aprueba compra
→ Sistema crea Notification
→ Usuario ve badge "1 nueva"
→ Al abrir notifications → Ve el mensaje
```

## 📡 API REST

Base URL: `http://localhost:3000/api`

### Endpoints Principales

#### Autenticación
- `POST /auth/register` - Registrarse
- `POST /auth/login` - Iniciar sesión

#### Cursos
- `GET /courses` - Listar cursos
- `GET /courses/:id` - Detalle de curso
- `POST /courses` (Admin) - Crear curso
- `PUT /courses/:id` (Admin) - Actualizar
- `DELETE /courses/:id` (Admin) - Eliminar

#### Lecciones
- `GET /courses/:courseId/lessons` - Listar lecciones
- `POST /courses/:courseId/lessons` (Admin) - Crear lección

#### Compras
- `POST /purchases` - Solicitar compra
- `GET /purchases/pending` (Admin) - Ver solicitudes
- `PATCH /purchases/:id/approve` (Admin) - Aprobar
- `PATCH /purchases/:id/reject` (Admin) - Rechazar

#### Progreso
- `GET /progress/courses/:courseId` - Ver progreso
- `PATCH /progress/lessons/:lessonId` - Marcar como completado

#### Notificaciones
- `GET /notifications` - Ver notificaciones
- `PATCH /notifications/:id/read` - Marcar como leída

#### Favoritos
- `GET /favorites` - Ver favoritos
- `POST /favorites/courses/:courseId` - Agregar favorito
- `DELETE /favorites/courses/:courseId` - Quitar favorito

Ver `ENDPOINTS.md` para documentación completa con ejemplos.

## 🔄 Estado Global (Frontend)

### AuthContext
```javascript
{
  user: { id, email, name, role },
  isAuthenticated: boolean,
  login(), register(), logout()
}
```

### CoursesContext
```javascript
{
  courses: [],
  purchases: [],
  pendingPurchases: [],
  progress: {},
  favorites: [],
  
  // Methods
  requestPurchase(courseId)
  approvePurchase(courseId)
  denyPurchase(courseId)
  completeLesson(courseId, lessonId)
  toggleFavorite(courseId)
  getPendingRequests()
  getUserPurchases()
}
```

## 📝 Scripts Disponibles

### Backend
```bash
npm run dev              # Desarrollo con watch
npm run build           # Compilar a JS
npm start               # Ejecutar compilado
npm run db:push         # Sincronizar schema
npm run db:studio       # Abrir Prisma Studio
npm run db:seed         # Crear admin
npm run lint            # Linter
npm run typecheck       # Verificar tipos
```

### Frontend
```bash
npm run dev             # Desarrollo con Vite
npm run build           # Build para producción
npm run preview         # Preview del build
npm run lint            # ESLint
```

## 📂 Estructura de Archivos Importante

### Backend - Configuración
- `backend/prisma/schema.prisma` - Esquema de BD
- `backend/src/main.ts` - Middleware de seguridad
- `backend/src/app.module.ts` - Registro de módulos
- `backend/.env.example` - Variables de entorno

### Frontend - Contexto
- `costura-app/src/context/AuthContext.jsx` - Autenticación
- `costura-app/src/context/CoursesContext.jsx` - Estado de cursos
- `costura-app/src/services/api.js` - Cliente HTTP

### Frontend - Páginas Críticas
- `costura-app/src/pages/Checkout.jsx` - Solicitud de compra (manual)
- `costura-app/src/pages/CourseDetail.jsx` - Visualizador con lecciones secuenciales
- `costura-app/src/pages/admin/AdminSales.jsx` - Panel de aprobación

## 🐛 Troubleshooting

### Error: "Connection refused" (BD)
```bash
# Verificar que PostgreSQL está corriendo
docker-compose up -d
# O iniciar PostgreSQL manualmente
```

### Error: "Invalid JWT token"
- Token expirado (24 horas)
- Secret mal configurado
- Verificar que Authorization header está correcto

### Error: "Cannot complete lesson"
- Usuario no tiene el curso comprado (status ≠ APPROVED)
- Lección anteror no está completada (secuencial)

### Error: Build falla en frontend
```bash
npm run typecheck  # Ver errores
npm run lint       # Ver eslint errors
```

## 📈 Próximas Mejoras (Post-MVP)

- [ ] Integración con Stripe/MercadoPago
- [ ] Búsqueda de cursos con Elasticsearch
- [ ] WebSockets para notificaciones en tiempo real
- [ ] Certificados de finalización
- [ ] Sistema de reviews
- [ ] Pagos recurrentes (suscripción)
- [ ] Descuentos y cupones
- [ ] Analytics de progreso
- [ ] Exportar certificados en PDF
- [ ] Sistema de comentarios en lecciones

## 👥 Roles y Permisos

### ALUMNO
- Ver cursos públicos
- Solicitar compra (crea PENDING)
- Ver sus compras (solo APPROVED)
- Completar lecciones secuencialmente
- Ver notificaciones
- Marcar favoritos

### ADMIN
- CRUD completo de cursos
- CRUD completo de lecciones
- Aprobar/rechazar compras
- Ver todos los usuarios
- Suspender/activar usuarios

## 🔗 Integración Frontend-Backend

### API Client (src/services/api.js)
```javascript
import api from '@/services/api';

// GET
const courses = await api.get('/courses');

// POST
const token = await api.post('/auth/login', { email, password });

// PATCH
await api.patch(`/progress/lessons/${lessonId}`, { completed: true });
```

### Contexto a Componente
```javascript
const { courses, requestPurchase } = useContext(CoursesContext);

// Usar en componente
handleBuy = () => requestPurchase(courseId);
```

## 📚 Dependencias Claves

### Backend
- **NestJS 10** - Framework
- **TypeScript 5** - Lenguaje
- **Prisma 5** - ORM
- **Passport.js** - Autenticación
- **bcrypt** - Hash de passwords
- **class-validator** - Validación de DTOs
- **Helmet** - Seguridad HTTP
- **Express Rate Limit** - Rate limiting

### Frontend
- **React 19** - UI
- **React Router 7** - Routing
- **Tailwind CSS 4** - Estilos
- **Vite 8** - Build tool
- **ESLint 9** - Linter

## 📞 Contacto

Para preguntas sobre la arquitectura o implementación:
- Revisar ENDPOINTS.md para referencia de API
- Revisar README.md en backend/ para setup detallado
- Verificar copilot-instructions.md para principios de diseño

---

**Última actualización**: Enero 2024
**Status**: MVP Completo - Backend en TypeScript + Frontend en React
**Próxima fase**: Integración frontend-backend + Testing
