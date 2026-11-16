# Etapa 1 — Cerrar las fugas de contenido pago (PDF)

## Problema
Dos fugas que anulan el paywall: una alumna autenticada puede obtener la URL del PDF de un
patrón de pago o de la guía PDF de un curso **sin compra aprobada**.

- **A1 — patrones**: `pattern-purchases.service.ts` devuelve `include: { pattern: true }` en
  `requestPurchase` y en `getUserPurchases`. Eso incluye `pattern.archivo` (URL pública del PDF).
  El detalle público del patrón sí lo protege (`archivo: hasAccess ? ... : null`).
- **A2 — cursos**: `favorites.service.ts` (`getUserFavorites`, `addFavorite`) y
  `purchases.service.ts` (`requestPurchase`, `getUserPurchases`, `getPurchaseById`) devuelven
  `course: true`, que incluye `pdfGuide`. El catálogo público lo excluye (`publicCourseSelect`).

## Objetivo
Ninguna respuesta de compras/favoritos puede exponer `archivo` (patrón) ni `pdfGuide` (curso).
La descarga del contenido pago sigue pasando por los endpoints del patrón/curso, que ya
verifican el acceso (`hasAccess` / `assertCourseAccess`).

## Alcance
- Backend: proyecciones explícitas en los servicios de compras (cursos y patrones) y favoritos.
- Tests de backend en `backend/test/` que lo garanticen.

## Fuera de alcance
- Las demás etapas de la auditoría (moneda, rate limit, catálogo limitado, etc.).
- Cambios en el flujo de descarga/aprobación ni en el frontend salvo que un test lo exija.

## Checklist
- [x] T1 — Patrones: `requestPurchase` y `getUserPurchases` no exponen `archivo`.
- [x] T2 — Cursos: compras y favoritos no exponen `pdfGuide`.
- [x] T3 — Tests que verifican ambas proyecciones y suites completas en verde.

## Criterios de aceptación
- [x] `POST /patterns/:id/purchase` no devuelve `archivo`.
- [x] `GET /pattern-purchases/user/:id` no devuelve `archivo`.
- [x] `POST /purchases`, `GET /purchases/user/:id`, `GET /favorites` no devuelven `pdfGuide`.
- [x] Backend: `npm test` (21 suites / 151 baseline) y `npm run build` en verde.
- [x] Frontend: `npm test` (34 archivos / 195 baseline) y `npm run lint` en verde.

## Progreso
- [x] T1 · [ ] T2 · [ ] T3
