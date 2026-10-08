# Soft-hide courses and patterns when they have sales

## Objective

"Eliminar" a curso/patrón debe ser inteligente:
- Si el item **tiene ventas** (purchases / patternPurchases) → **ocultarlo** (active = false): desaparece del catálogo público pero el historial de pagos queda intacto.
- Si **no tiene ventas** → **borrarlo definitivamente** (funciona hoy, no hay FK RESTRICT que lo bloquee cuando no hay compras).

## Why

Hoy las FKs reales de la DB son `ON DELETE RESTRICT` en `purchases.courseId -> courses` y `pattern_purchases.patternId -> patterns`, así que borrar un item con ventas tira error de FK (P2003) y el admin ve "No se pudo borrar". Bloquear todo el borrado es malo; borrar el historial de pagos con cascade es peligroso. La solución es ocultar los que tienen ventas.

## Backend

- **T1** Schema: `Pattern.active Boolean @default(true)` + migración aditiva `add_pattern_active` (aplicar a Supabase con `prisma migrate deploy` + `prisma generate`).
- **T2** DTOs: `active?: boolean` (transform string->boolean para multipart) en `UpdatePatternDto` y `CreateCourseDto` (para que `UpdateCourseDto` lo herede). `Course.active` ya existe.
- **T3** `PatternsService.findAllPublic`: filtrar `where: { active: true }` (el admin usa `findAll`, que ve todo).
- **T4** Admin findAll muestran todo + conteo de ventas:
  - `courses.service.findAll` (rama admin): sin filtro de `active`, incluir `_count: { select: { purchases: true } }`.
  - `patterns.service.findAll`: incluir `_count: { select: { patternPurchases: true } }`.
- **T5** Delete inteligente (`courses.service.delete` y `patterns.service.delete`):
  - contá purchases / patternPurchases del item;
  - si > 0 → `update({ active: false })` y devolvé `{ id, title/titulo, action: 'hidden' }`;
  - si 0 → `delete` y devolvé `{ id, ..., action: 'deleted' }`.
- **T6** Tests backend (mocked service): delete oculta cuando hay compras; borra cuando no hay; findAllPublic filtra activos; findAll admin incluye `_count`.

## Frontend

- **T7** `AdminCourses.jsx` y `AdminPatterns.jsx`:
  - Botón inteligente por item:
    - visible + con ventas (`_count > 0`) → botón "Ocultar" (confirm con la cantidad: "...tiene N ventas; se ocultará del catálogo conservando el historial").
    - visible + sin ventas → botón "Eliminar" (confirm "definitivamente, no se puede deshacer").
    - oculto → botón "Mostrar" (reactiva: PATCH con active=true).
  - Al terminar, mostrar el resultado (`alertDialog` con "ocultado" o "eliminado") y recargar la lista.
  - Badge "Oculto" (tone neutral/danger?) en los items ocultos.

## Constraints

- Migración aditiva (nullable/default), sin tocar datos existentes.
- Reusar `SearchInput`, `Badge`, `EmptyState`, `LoadingState`, `Modal`/`DialogContext`, `.btn`, tokens.
- No tocar las FKs (el ocultar es la solución, no cambiar RESTRICT a CASCADE).
- Verificación: `cd backend && npm test && npm run typecheck` y `cd costura-app && npm test && npm run lint && npm run build`.

## Delivery

Forecast ~400-600 líneas. PR simple dev -> main (flujo del proyecto).