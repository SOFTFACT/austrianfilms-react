import { test as setup, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

/**
 * Session bootstrap for the whole suite.
 *
 * Logs in through the real API (via the Vite proxy, so it stays same-origin),
 * plants the resulting token + user into localStorage under the app's storage
 * keys, and writes the browser state to e2e/.auth/user.json. Every other
 * project reuses that state instead of walking the login form again.
 *
 * Credentials come from E2E_USER / E2E_PASSWORD — see .env.e2e.example.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')

const USER = process.env.E2E_USER ?? 'Designer'
const PASSWORD = process.env.E2E_PASSWORD ?? 'gulp'

// Storage keys derive from API4DConfig.storagePrefix ('austrianfilms').
const KEYS = {
  token: 'austrianfilms_token',
  user: 'austrianfilms_user',
  expires: 'austrianfilms_expires_at',
  refresh: 'austrianfilms_refresh_token',
}

setup('authenticate', async ({ page }) => {
  const res = await page.request.post('/api/v1/auth/login', {
    headers: { 'Content-Type': 'application/json' },
    data: { username: USER, password: PASSWORD },
  })

  expect(
    res.ok(),
    `Login for "${USER}" failed with HTTP ${res.status()}. Is the 4D server on :8181 running, ` +
      'and are E2E_USER / E2E_PASSWORD set correctly in .env.e2e?',
  ).toBeTruthy()

  const body = (await res.json()) as {
    token?: string
    refresh_token?: string
    expires_in?: number
    mfaRequired?: boolean
    user?: { id: string; username: string; role?: string }
  }

  expect(
    body.mfaRequired,
    `"${USER}" requires a second factor (OTP), which cannot be automated. ` +
      'The E2E account needs its OTP channel set to 0.',
  ).toBeFalsy()
  expect(body.token, 'Login returned no token').toBeTruthy()

  // Plant the session the way the app itself would (see api4d/authState.ts).
  // Both token AND user must be present — AuthProvider derives
  // isAuthenticated from the pair, so a missing user reads as logged out.
  await page.goto('/app/login')
  await page.evaluate(
    ({ body, KEYS }) => {
      localStorage.setItem(KEYS.token, body.token!)
      localStorage.setItem(KEYS.user, JSON.stringify(body.user ?? { id: '-1', username: 'e2e' }))
      if (body.expires_in) {
        localStorage.setItem(
          KEYS.expires,
          new Date(Date.now() + body.expires_in * 1000).toISOString(),
        )
      }
      if (body.refresh_token) localStorage.setItem(KEYS.refresh, body.refresh_token)
    },
    { body, KEYS },
  )

  // Prove the planted session actually authenticates before saving it —
  // otherwise every spec fails later with a confusing redirect to /login.
  await page.goto('/app/')
  await expect(page.getByRole('heading', { name: 'Welcome to Austrian Films' })).toBeVisible()

  await page.context().storageState({ path: AUTH_FILE })
})
