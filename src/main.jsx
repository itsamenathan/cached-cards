import { registerSW } from 'virtual:pwa-register'
// gray-matter pulls in a transitive dependency that expects a global Buffer,
// which browsers do not provide. The polyfill is only needed for that parse.
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
  },
)
