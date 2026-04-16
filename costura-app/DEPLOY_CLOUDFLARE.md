# Despliegue en Cloudflare Pages (Costura-app)

Pasos para dejar el frontend listo y desplegar en Cloudflare Pages.

1) Ajustes en el repositorio
- Asegúrate de que el proyecto del frontend esté en `costura-app`.
- El comando de build ya existe: `npm run build` (Vite) y genera la carpeta `dist`.

2) Variables de entorno
- Local: `costura-app/.env.local` (ya presente).
- Producción: `costura-app/.env.production` (archivo con placeholder creado). Reemplaza `VITE_API_URL` por la URL de tu API en producción.
- Opcional: en Cloudflare Pages puedes definir variables de entorno desde la UI (Settings → Environment variables). Define `VITE_API_URL` ahí y evita subir secrets al repo.

3) Build y output
- Build command: `npm run build`
- Build output directory: `dist`

4) Routing (SPA)
- Este proyecto usa `react-router` con `BrowserRouter`. Para que los deep-links funcionen, debes configurar Cloudflare Pages para servir `index.html` como fallback de SPA.
- En la UI de Cloudflare Pages hay una opción para habilitar "SPA fallback" o "Serve a fallback HTML page for 404s"; actívala. Hemos incluido `public/404.html` que Vite copiará a `dist/404.html` para proporcionar un fallback automático si no activas la opción.

5) Pasos rápidos para desplegar (UI)
1. Push del repo a GitHub.
2. En Cloudflare → Pages, crea un nuevo proyecto y conecta tu repositorio.
3. En Build settings: framework preset → `Vite` o configura manualmente:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Agrega la variable `VITE_API_URL` en Environment variables (Production).
5. Deploy.

6) Verificación local
- Para probar localmente antes de push:

```bash
cd costura-app
npm ci
npm run build
npm run preview
```

7) Sugerencias adicionales
- Si quieres despliegues automáticos desde GitHub, usa Cloudflare Pages conectar el repo (no necesitas GitHub Actions).
- Si prefieres un pipeline por Actions, configuro uno si lo quieres.
