import { test, expect } from '@playwright/test'

/**
 * Smoke test across every list area: the route resolves, the heading renders,
 * the list driver reports a total, and nothing errors out on the console.
 *
 * Cheap insurance for the shared plumbing — a broken api4d client, a renamed
 * query param or a resource the router forgot shows up here first.
 */

const AREAS = [
  { path: '/films', heading: 'Films' },
  { path: '/festivals', heading: 'Festivals' },
  { path: '/itineraries', heading: 'Itineraries' },
  { path: '/persons', heading: 'Persons' },
]

for (const { path, heading } of AREAS) {
  test(`${heading} loads and reports a total`, async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()

    // Every list renders "N total" once its first page has arrived.
    await expect(page.getByText(/^[\d.,]+ total$/).first()).toBeVisible({ timeout: 30_000 })

    expect(consoleErrors, `console errors on ${path}`).toEqual([])
  })
}

test('an unknown route falls back to the dashboard', async ({ page }) => {
  await page.goto('/does-not-exist')

  await expect(page).toHaveURL(/localhost:5181\/$/)
  await expect(page.getByRole('heading', { name: 'Welcome to Austrian Films' })).toBeVisible()
})
