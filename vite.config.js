import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
