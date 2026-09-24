import { test, expect } from '@playwright/test'

/**
 * A render error must show the app's own error page instead of a blank screen.
 * Produced by a malformed list answer (`data: [null]`), which is what a
 * half-migrated endpoint or a proxy error page with status 200 can deliver.
 */
test('A render error shows the error page with Reload', async ({ page }) => {
  let intercepted = 0
  await page.route(/\/api\/v1\/fmfilms(\?|$)/, async (route) => {
    intercepted++
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [null], pagination: { page: 1, pages: 1, total: 1, hasNext: false } }),
    })
  })
  await page.goto('/films')

  await expect.poll(() => intercepted, { message: 'the list request was intercepted' }).toBeGreaterThan(0)
  await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
})
