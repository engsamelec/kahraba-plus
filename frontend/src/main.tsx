import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// One-time cleanup: a previous build shipped a PWA service worker that cached
// the app and made deployments appear "stuck" until users cleared their
// browser cache. Unregister any lingering service worker and drop its caches
// so returning visitors transparently get the latest version. Safe to keep —
// it's a no-op once nothing is registered.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister())
  })
  if (window.caches) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
