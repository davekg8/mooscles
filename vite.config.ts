import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon-48.png', 'apple-touch-icon.png', 'push-sw.js', 'brand/*.webp'],
      workbox: {
        importScripts: ['push-sw.js'],
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,webmanifest}'],
      },
      manifest: {
        name: 'Mooscles - Challenge Sportif',
        short_name: 'Mooscles',
        description: 'Challenge sportif entre potes : 250 pompes, 250 squats, 10 min de gainage par semaine !',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        theme_color: '#090A0D',
        background_color: '#090A0D',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
