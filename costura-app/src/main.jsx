import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import './index.css'
import i18n from './i18n'
import App from './App.jsx'
import { registerServiceWorker } from './utils/serviceWorkerRegistration'

// PWA boot: register the service worker (push + notification clicks) as early
// as possible. The helper guards navigator.serviceWorker, so this is a no-op
// in jsdom/unsupported browsers and never blocks first render.
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>,
)
