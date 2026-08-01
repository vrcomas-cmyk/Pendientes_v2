import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografía (autohospedada vía @fontsource: funciona offline en la PWA, sin depender de un CDN).
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA: registrar service worker SOLO en producción (offline + auto-actualización).
// En desarrollo lo desregistramos para que nunca sirva código viejo desde caché.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    })
  } else {
    navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister())).catch(() => {})
    if (window.caches) caches.keys().then(ks => ks.forEach(k => caches.delete(k))).catch(() => {})
  }
}
