#!/usr/bin/env node
// Deploy helper for the ecoline-react frontend.
//
// Topology: Caddy on a Windows machine serves the static build and proxies
// /api + /mcp to the 4D server. The build is transferred MANUALLY via
// TeamViewer file transfer into  C:\Caddy\ecoline-react  on that machine.
//
// This script produces a clean build + a single zip (more reliable over
// TeamViewer than a multi-file folder drag) and reveals it in Finder.

import { execSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const ZIP = path.join(ROOT, 'ecoline-react-dist.zip')
const TARGET = 'C:\\Caddy\\ecoline-react'

function run(cmd, cwd = ROOT) {
  console.log(`\n› ${cmd}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

// 1. Remove the stale zip, then build. Vite empties dist/ on each build,
//    so no orphaned hash-chunks survive locally.
if (existsSync(ZIP)) rmSync(ZIP)
run('npm run build')

if (!existsSync(path.join(DIST, 'index.html'))) {
  console.error('\n✗ dist/index.html fehlt — Build unvollständig, Abbruch.')
  process.exit(1)
}

// 2. Zip the *contents* of dist/ (cd into it) so extraction yields
//    index.html + assets/ at the top level, ready to drop into the target.
run('zip -rq ../ecoline-react-dist.zip .', DIST)

// 3. Reveal the zip in Finder, selected and ready to drag into TeamViewer.
run(`open -R "${ZIP}"`)

console.log(`
✓ Deploy-Artefakt fertig.

  ZIP    : ${ZIP}
  Ordner : ${DIST}   (Alternative: Ordnerinhalt statt ZIP ziehen)

  → Per TeamViewer auf die Windows-Maschine übertragen und entpacken nach:
      ${TARGET}

  Wichtig: Zielordner VORHER leeren (alte assets/*-Hash-Chunks entfernen),
  sonst sammeln sich verwaiste Dateien an. Caddy liefert index.html mit
  no-cache aus → die neue Version greift sofort, ohne Browser-Cache-Reset.
`)
