// Run by the "prepare" script on every npm install: points git at .githooks.
//
// Must never fail the install. A copy without .git (zip export, Docker build
// context, CI tarball) made `git config` exit 128, and a failing "prepare"
// aborts the whole `npm install` / `npm ci`. Plain Node instead of `|| true`,
// because npm runs scripts through cmd.exe on Windows.
import { execSync } from 'node:child_process'

try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' })
} catch {
  process.exit(0) // not a git checkout (or no git at all) — nothing to install
}
execSync('git config core.hooksPath .githooks', { stdio: 'inherit' })
