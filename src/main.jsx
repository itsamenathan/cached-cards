import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { Buffer } from 'buffer'
import './index.css'
import App from './App.jsx'

registerSW({ immediate: true })

if (!window.Buffer) {
  window.Buffer = Buffer
}

if (import.meta.env.PROD) {
  const script = document.createElement('script')
  script.defer = true
  script.setAttribute('data-domain', 'cachedcards.com')
  script.src = 'https://vince.home.frcv.net/js/script.js'
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
