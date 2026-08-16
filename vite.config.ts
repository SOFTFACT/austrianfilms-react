import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite dev proxy: /api and /mcp -> AustrianFilms 4D server on :8181.
// Same-origin routing in dev sidesteps CORS and keeps fetch/cookie defaults
// simple (the 4D server also sends CORS headers, but first-party is robust).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // @softfact/api4d-react is linked from a sibling checkout that carries its
    // own node_modules/react. Without dedupe a production build can bundle a
    // SECOND React copy: the app then mounts into an empty root, renders
    // nothing and logs nothing — a white page the dev server never shows.
    // (Hit ecoline-react on 2026-08-16.)
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // Own port (mirrors backend 8181) to avoid clashing with sibling frontends.
    port: 5181,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:8181', changeOrigin: true },
      '/mcp': { target: 'http://localhost:8181', changeOrigin: true },
      // Film/poster images are served by 4D at /getimage?type=film&id=...
      '/getimage': { target: 'http://localhost:8181', changeOrigin: true },
      // Static country flag SVGs served from the 4D web root (WebFolder/flags).
      '/flags': { target: 'http://localhost:8181', changeOrigin: true },
    },
  },
})
