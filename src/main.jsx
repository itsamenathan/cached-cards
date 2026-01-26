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
  script.setAttribute(
    'data-goatcounter',
    'https://goatcounter.home.frcv.net/count',
  )
  script.async = true
  script.src = '//goatcounter.home.frcv.net/count.js'
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
