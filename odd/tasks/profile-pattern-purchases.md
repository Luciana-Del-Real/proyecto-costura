# Feature: Historial de compras con patrones en "Mi perfil"

## Objetivo
El historial de compras de "Mi perfil" debe listar **cursos y patrones** (los dos), con el
total invertido sumando ambos.

## Problema
- `GET /purchases/user/:userId` solo devuelve compras de **cursos** (`Purchase`).
- El backend no expone ninguna ruta de "mis compras de **patrones**": el controller de
  `pattern-purchases` solo tiene `POST patterns/:patternId/purchase` y rutas de admin.
- `Profile.jsx` consume `usePurchases().purchaseRecords` y renderiza `record.course`, por eso
  los patrones nunca aparecen en el historial.

## Por qué
La alumna compra patrones sueltos (además de cursos) y el historial de su perfil los ignora:
parece que nunca los compró. El panel de ventas del admin ya los cuenta, pero el lado de la
alumna no.

## Alcance
- **Backend**: endpoint de alumna para sus compras de patrones (mismo criterio de seguridad que
  el de cursos: dueño o admin).
- **Frontend**: `PurchaseContext` carga y expone los registros de patrones; `Profile` fusiona
  cursos + patrones en una sola lista ordenada por fecha.
- Solo compras **APPROVED** (mismo criterio que los cursos). Los patrones ya se cobran en la
  moneda de la compradora (`total` viene calculado), así que no hay conversión nueva.

## Fuera de alcance
- Cambiar el flujo de compra/aprobación de patrones.
- Mostrar patrones PENDING/REJECTED en el historial.
- Tocar el panel de ventas del admin (ya cuenta patrones).

## Restricciones
- **UTF-8 siempre**: los archivos tienen acentos en español. Editar con herramientas que
  preserven UTF-8 sin BOM (`[IO.File]::ReadAllText/WriteAllText` + `UTF8Encoding($false)`).
- Sin dependencias nuevas.
- El fallo al cargar compras de patrones **no** puede romper el historial de cursos.
- Rutas: `dev` → PR a `main` (el usuario mergea).

## Checklist

### T1 — Endpoint de compras de patrones de la alumna
- [x] `PatternPurchasesService.getUserPurchases(userId)`: `patternPurchase.findMany` con
      `where: { userId, deletedAt: null }`, `include: { pattern: true, user: { select: ... } }`,
      `orderBy: { createdAt: 'desc' }` (mismo shape que `PurchasesService.getUserPurchases`).
- [x] Ruta `GET pattern-purchases/user/:userId` con `JwtAuthGuard` + verificación dueño/admin
      (mismo `ForbiddenException` que `purchases.controller.ts`).
- [x] Test del backend si el módulo tiene convención de tests con Prisma mockeado.

### T2 — `PurchaseContext` expone los patrones
- [x] Nuevo estado `patternPurchaseRecords` + carga desde
      `GET /pattern-purchases/user/:id` dentro de `refreshMyPurchases`.
- [x] Si esa carga falla, el historial de cursos sigue funcionando (log + lista vacía).
- [x] Reset a `[]` cuando no hay usuario; exponer el valor en el provider.

### T3 — `Profile` fusiona ambos historiales
- [x] Lista única cursos + patrones, ordenada por `createdAt` descendente.
- [x] Cada fila: imagen, título, tipo visible ("Curso" / "Patrón"), nivel, fecha, importe.
      Patrones: `pattern.titulo`, `pattern.nivel`, `pattern.imagen` (campos en español).
- [x] `Total invertido` = suma de cursos + patrones.
- [x] Empty state y mensajes de loading/error sin cambios.
- [x] `Profile.test.jsx`: test nuevo con 1 curso + 1 patrón (aparecen ambos títulos y el total
      suma ambos) y mock del contexto actualizado.

## Alcance autorizado de edición
```
backend/src/pattern-purchases/pattern-purchases.service.ts
backend/src/pattern-purchases/pattern-purchases.controller.ts
backend/src/pattern-purchases/pattern-purchases.service.spec.ts   (solo si aplica la convención)
costura-app/src/context/PurchaseContext.jsx
costura-app/src/pages/Profile.jsx
costura-app/src/pages/Profile.test.jsx
```

## Criterios de aceptación
- [x] `GET /pattern-purchases/user/:userId` devuelve las compras de patrones de esa alumna y
     Forbidden para otra alumna.
- [x] "Mi perfil" lista patrones y cursos juntos, ordenados por fecha.
- [x] "Total invertido" incluye ambos.
- [x] Frontend: `npm test` (33 archivos / 187 tests), `npm run lint`, `npm run build` en verde.
- [x] Backend: `npm test` (21 suites / 151 tests) y `npm run build` en verde.

## Checks
| Comando | Baseline |
|---|---|
| `cd backend && npm test` | 21 suites / 151 tests |
| `cd backend && npm run build` | limpio |
| `cd costura-app && npm test` | 33 archivos / 187 tests |
| `cd costura-app && npm run lint` | limpio |
| `cd costura-app && npm run build` | limpio |

## Progreso
- [x] Exploración: hueco confirmado (no existe endpoint de alumna para patrones).
- [x] T1 · [ ] T2 · [ ] T3

## Evidencia
- Commit de unidad de trabajo: `1806703` (`feat(profile): include pattern purchases in the student's purchase history`).
- PR: https://github.com/Luciana-Del-Real/proyecto-costura/pull/71
- Verificacion: backend 21 suites / 151 tests; frontend 33 archivos / 187 tests; lint y build limpios; UTF-8 sin BOM.

## Próximo paso
Entregado en PR (ver seccion Evidencia).
