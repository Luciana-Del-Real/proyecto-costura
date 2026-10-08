import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/serviceWorkerRegistration'

// PWA boot: register the service worker (push + notification clicks) as early
// as possible. The helper guards navigator.serviceWorker, so this is a no-op
// in jsdom/unsupported browsers and never blocks first render.
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
