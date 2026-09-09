import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite dev proxy: /api and /mcp -> AustrianFilms 4D server on :8181.
// Same-origin routing in dev sidesteps CORS and keeps fetch/cookie defaults
// simple (the 4D server also sends CORS headers, but first-party is robust).
const BACKEND = 'http://localhost:8181'

// Shared by `server` and `preview` so the built bundle can be exercised the
// same way as dev — see the preview block below for why that matters.
const proxy = {
  '/api': { target: BACKEND, changeOrigin: true },
  '/mcp': { target: BACKEND, changeOrigin: true },
  // Film/poster images are served by 4D at /getimage?type=film&id=...
  '/getimage': { target: BACKEND, changeOrigin: true },
  // Static country flag SVGs served from the 4D web root (WebFolder/flags).
  '/flags': { target: BACKEND, changeOrigin: true },
  // Site images from the 4D web root (favicon).
  '/images': { target: BACKEND, changeOrigin: true },
}

export default defineConfig({
  build: {
    // The build lands in the 4D repo's WebFolder and is committed there:
    // a git pull on the server deploys frontend and backend together, and
    // Caddy serves the folder as app.af.softfact.com (CADDY/Caddyfile in
    // that repo; locally http://localhost:8091 via Caddyfile.dev).
    outDir: '../AustrianFilms/WebFolder/app',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    // @softfact/api4d-react is linked from a sibling checkout that carries its
    // own node_modules/react. Without dedupe a production build can bundle a
    // SECOND React copy: the app then mounts into an empty root, renders
    // nothing and logs nothing — a white page the dev server never shows.
    // (Hit ecoline-react on 2026-08-16.)
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  server: {
    // Own port (mirrors backend 8181) to avoid clashing with sibling frontends.
    port: 5181,
    strictPort: true,
    proxy,
  },
  // `vite preview` serves the real production bundle, and with this proxy it
  // is a complete local check — login and data pages included. Worth having:
  // neither the dev server nor Playwright ever touches the built output, so
  // build-only breakage stays invisible until deployment. ecoline-react hit
  // exactly that on 2026-08-16 (duplicate React and react-query instances:
  // white page / "No QueryClient set", both silent in dev).
  preview: {
    port: 4181,
    strictPort: true,
    proxy,
  },
})
