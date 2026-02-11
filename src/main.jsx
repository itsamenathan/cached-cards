import { registerSW } from 'virtual:pwa-register'
import { Buffer } from 'buffer'
import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './routes.jsx'
import './index.css'

export const createRoot = ViteReactSSG(
  { routes, basename: import.meta.env.BASE_URL },
  ({ isClient }) => {
    if (!isClient) return

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
  },
)
