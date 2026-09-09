import { test, expect } from '@playwright/test'

/**
 * Login flow — the one spec that must NOT reuse the saved session, so it
 * starts from a blank storage state and drives the real form.
 *
 * Covers both ways a user reaches /login and gets sent back:
 *  - cold load of a protected deep link → ProtectedRoute's router state.from
 *  - mid-session expiry → REDIRECT_AFTER_LOGIN_KEY in sessionStorage, which
 *    survives the hard redirect that drops router state (api4d/client.ts)
 */
test.use({ storageState: { cookies: [], origins: [] } })

const USER = process.env.E2E_USER ?? 'Designer'
const PASSWORD = process.env.E2E_PASSWORD ?? 'gulp'

async function signIn(page: import('@playwright/test').Page, password: string) {
  await page.getByLabel('Username').fill(USER)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('a protected route bounces to the login form', async ({ page }) => {
  await page.goto('/app/films')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Backoffice — please sign in.')).toBeVisible()
})

test('valid credentials land on the dashboard', async ({ page }) => {
  await page.goto('/app/login')
  await signIn(page, PASSWORD)

  await expect(page.getByRole('heading', { name: 'Welcome to Austrian Films' })).toBeVisible()
  await expect(page).toHaveURL(/localhost:5181\/app\/?$/)
})

test('a wrong password surfaces the server message and stays on the form', async ({ page }) => {
  await page.goto('/app/login')
  await signIn(page, 'definitely-wrong')

  // The page renders the RFC 7807 `detail` from the backend verbatim.
  await expect(page.getByText('Invalid username or password.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
})

test('after login the user returns to the deep link they asked for', async ({ page }) => {
  await page.goto('/app/festivals')
  await expect(page).toHaveURL(/\/login$/)

  await signIn(page, PASSWORD)

  await expect(page).toHaveURL(/\/festivals$/)
  await expect(page.getByRole('heading', { name: 'Festivals' })).toBeVisible()
})

test('a stashed redirect path (mid-session expiry) wins over the dashboard', async ({ page }) => {
  // Simulate what forceLogout leaves behind when a session dies mid-session:
  // router state is gone, only sessionStorage carries the return path.
  await page.goto('/app/login')
  // forceLogout stores window.location.pathname, prefix included — the app
  // must strip it before handing the path to the router (lib/base.ts).
  await page.evaluate(() => sessionStorage.setItem('api4d_redirect_after_login', '/app/parties'))
  await page.reload()

  await signIn(page, PASSWORD)

  await expect(page).toHaveURL(/\/app\/parties$/)
  await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible()
  // Consumed on read — a later login must not be hijacked by a stale value.
  expect(await page.evaluate(() => sessionStorage.getItem('api4d_redirect_after_login'))).toBeNull()
})
