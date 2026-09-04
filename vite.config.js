import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // NEXT_PUBLIC_ is accepted alongside Vite's own prefix so the Mapbox token
  // can use the conventional NEXT_PUBLIC_MAPBOX_TOKEN name. Anything with
  // either prefix is inlined into the client bundle — public values only.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'og-image.svg', 'icon-192.png', 'icon-512.png', 'app-icon-1024.png'],
      manifest: {
        name: 'The Way — Read the Bible. Follow Jesus.',
        short_name: 'The Way',
        description: 'Study the King James Bible with Strong\'s word study, commentaries, memory verses, and journaling.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f2',
        theme_color: '#c9a84c',
        categories: ['education', 'books'],
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/app-icon-1024.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // Pre-cache the app shell
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The map engine and the geocoding dataset are excluded from precache.
        // mapbox-gl is loaded as a UMD global from /mapbox-gl.js (public/).
        // Mapbox's terms also don't allow stashing their tiles offline.
        globIgnores: ['**/mapbox-gl.js', '**/mapbox-gl.css', '**/mapbox-gl-*.js', '**/mapbox-gl-*.css', '**/bible-places-*.js'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Server-rendered SEO pages (/bible/*, /verses-about/*, sitemaps) must
        // never be answered with the app shell by the service worker.
        navigateFallbackDenylist: [/^\/bible(\/|$)/, /^\/verses-about(\/|$)/, /^\/sitemap/, /^\/api\//],
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Bible API — cache chapters as they're read
            urlPattern: /^https:\/\/bible-api\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-chapters',
              expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Search index — cache for offline keyword search
            urlPattern: /\/data\/search-index\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'search-index',
              expiration: { maxEntries: 1, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 24 * 60 * 60 },
            },
          },
          {
            // Google Fonts files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase API — network first, fall back to cache
            urlPattern: /^https:\/\/.*\.supabase\.co\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/data/biblePlaces.json')) return 'bible-places';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api/commentary': {
        target: 'https://historicalchristian.faith',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/commentary/, ''),
      },
      '/api/websters': {
        target: 'https://webstersdictionary1828.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/websters/, '/Dictionary'),
      },
    },
  },
})
