import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL } from './lib/api'

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

function render() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Region-based default language: if the visitor hasn't picked a language yet,
// ask the backend (which reads the country from the edge/proxy) for a
// suggestion — Israel → Hebrew, Palestine & Arab regions → Arabic, else
// English. Time-boxed so a slow/absent geo lookup never delays the app.
declare global {
  interface Window {
    __kahrabaLang?: string
  }
}

if (localStorage.getItem('kahraba_lang')) {
  render()
} else {
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1200))
  const geo = fetch(`${API_BASE_URL}/geo/lang`)
    .then((r) => r.json())
    .then((d) => {
      if (d && typeof d.lang === 'string') window.__kahrabaLang = d.lang
    })
    .catch(() => {})
  Promise.race([geo, timeout]).finally(render)
}
