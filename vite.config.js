import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

const buildDate = process.env.VITE_BUILD_DATE || new Date().toISOString().slice(0, 10)
let gitSha = 'unknown'
if (process.env.GITHUB_SHA) {
  gitSha = process.env.GITHUB_SHA.slice(0, 7)
} else {
  try {
    gitSha = execSync('git rev-parse --short HEAD').toString().trim()
  } catch (_) {
    gitSha = 'unknown'
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __BUILD_DATE__: JSON.stringify(buildDate),
    __GIT_SHA__: JSON.stringify(gitSha),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon.svg',
        'icons/icon-32.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ],
      manifest: {
        name: 'Cached Cards',
        short_name: 'Cached Cards',
        description: 'Offline-first library for card game rules.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#0b0d12',
        theme_color: '#f8f1df',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pages',
            },
          },
        ],
      },
    }),
  ],
})
