import { defineConfig, devices } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Load credentials from .env.e2e (gitignored) without pulling in dotenv.
// Real environment variables always win, so CI can override without a file.
try {
  for (const line of readFileSync(new URL('.env.e2e', import.meta.url), 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  /* no .env.e2e — fall back to the environment (see e2e/auth.setup.ts) */
}

/**
 * Playwright E2E configuration for Austrian Films.
 *
 * The suite drives the real app against the local 4D backend on :8181
 * (through the Vite dev proxy on :5181). Every spec is READ-ONLY — nothing
 * here creates, edits or deletes a record.
 *
 * Run:      npm run test:e2e
 * Headed:   npm run test:e2e -- --headed
 * Single:   npm run test:e2e -- -g "search"
 *
 * The `setup` project logs in once via the API and stores the session in
 * e2e/.auth/user.json; every other project reuses it. Credentials come from
 * E2E_USER / E2E_PASSWORD (see .env.e2e.example).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // A single 4D backend serves the suite; parallel workers only make the
  // specs compete for its request slots.
  fullyParallel: false,
  workers: 1,
  // One retry so a genuine failure and a timing hiccup stay distinguishable.
  retries: 1,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5181',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // --- Session bootstrap (API login → storage state), runs first ---
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // --- Main suite, authenticated ---
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],

  // Start the Vite dev server unless one is already listening on :5181.
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5181',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
