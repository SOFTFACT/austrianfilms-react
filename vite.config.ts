import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { execSync } from 'node:child_process'

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

/**
 * Commit (and "+dirty" when uncommitted sources are compiled in) plus the
 * COMMIT time, inlined via `define` and exposed as <html data-build="…">.
 * Answers "which build is actually running?" after a deploy.
 *
 * Commit time, not build time: a build-time stamp made every build unique, so
 * a rebuild of an unchanged commit was never byte-identical and the deploy
 * script's "dist unchanged — nothing to commit" check could never fire.
 *
 * The shared client is linked from ../api4d-react and compiled into this
 * bundle, so its commit (and dirtiness) is part of the stamp too.
 *
 * Never throws: a build without git history reports "unknown".
 */
function buildStamp(): { commit: string; builtAt: string } {
  const dir = import.meta.dirname
  const git = (args: string, cwd = dir) =>
    execSync(`git ${args}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  let commit = 'unknown'
  let builtAt = 'unknown'
  try {
    commit = git('rev-parse --short HEAD')
    builtAt = git('log -1 --format=%cI')
    // Only what enters the bundle counts; a stray untracked note elsewhere
    // must not mark every build dirty.
    if (git('status --porcelain -- src public index.html vite.config.ts package.json package-lock.json tsconfig.json tsconfig.app.json')) commit += '+dirty'
  } catch {
    // no git available — "unknown" is the honest answer
  }
  try {
    const lib = path.resolve(dir, '../api4d-react')
    commit += ` lib:${git('rev-parse --short HEAD', lib)}${git('status --porcelain -- src package.json', lib) ? '+dirty' : ''}`
  } catch {
    // no sibling checkout (e.g. the package came from a registry) — nothing to add
  }
  return { commit, builtAt }
}

const stamp = buildStamp()

export default defineConfig({
  define: {
    __BUILD_COMMIT__: JSON.stringify(stamp.commit),
    __BUILD_TIME__: JSON.stringify(stamp.builtAt),
  },
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
