import { test, expect } from '@playwright/test'

/**
 * Logging out must end the session on the server, not only in the browser.
 *
 * Uses its own fresh session instead of the suite's shared storageState:
 * revoking the shared refresh token would log every later spec out.
 * The refresh token is spent exactly once — a refresh rotates it, so a retry
 * loop would turn green on its second attempt even without a logout.
 */
test.use({ storageState: { cookies: [], origins: [] } })

const USER = process.env.E2E_USER ?? 'Designer'
const PASSWORD = process.env.E2E_PASSWORD ?? 'gulp'
const KEYS = {
  token: 'austrianfilms_token',
  user: 'austrianfilms_user',
  expires: 'austrianfilms_expires_at',
  refresh: 'austrianfilms_refresh_token',
}

test('Signing out revokes the session on the server', async ({ page }) => {
  const res = await page.request.post('/api/v1/auth/login', { data: { username: USER, password: PASSWORD } })
  expect(res.ok(), 'API login').toBeTruthy()
  const body = (await res.json()) as { token: string; refresh_token?: string; expires_in?: number; user?: unknown }
  expect(body.refresh_token, 'login returned a refresh token').toBeTruthy()

  await page.goto('/login')
  await page.evaluate(
    ({ body, KEYS }) => {
      localStorage.setItem(KEYS.token, body.token)
      localStorage.setItem(KEYS.user, JSON.stringify(body.user ?? { id: '-1', username: 'e2e' }))
      if (body.expires_in) localStorage.setItem(KEYS.expires, new Date(Date.now() + body.expires_in * 1000).toISOString())
      localStorage.setItem(KEYS.refresh, body.refresh_token!)
    },
    { body, KEYS },
  )
  await page.goto('/')

  const logoutResponse = page
    .waitForResponse((r) => r.url().includes('/auth/logout'), { timeout: 5000 })
    .catch(() => null)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login/)
  const logout = await logoutResponse
  expect(logout, 'the app sent POST /auth/logout').not.toBeNull()
  expect(logout!.status()).toBe(204)

  const refresh = await page.request.post('/api/v1/auth/refresh', { data: { refresh_token: body.refresh_token } })
  expect(refresh.status(), 'the old refresh token is rejected after logout').toBe(401)
})
