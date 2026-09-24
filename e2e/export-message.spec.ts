import { test, expect } from '@playwright/test'

/**
 * A failed export reports itself next to the Export button instead of a
 * native alert(), which blocks the tab and cannot be styled or dismissed
 * by keyboard in the app's own way.
 */
test('a failed export shows an inline message, not a native alert', async ({ page }) => {
  const native: string[] = []
  page.on('dialog', (d) => {
    native.push(d.message())
    void d.dismiss()
  })
  await page.goto('/films')
  await expect(page.getByText(/^[\d.,]+ total$/).first()).toBeVisible()

  // Only the export's page fetches fail: the list is already loaded.
  let failed = 0
  await page.route(/\/api\/v1\/fmfilms(\?|$)/, (route) => {
    failed++
    return route.fulfill({ status: 500, contentType: "application/problem+json", body: JSON.stringify({ title: "Internal Server Error", status: 500 }) })
  })
  await page.getByRole('button', { name: 'Export' }).click()
  await page.getByRole('button', { name: /CSV/ }).click()

  await expect.poll(() => failed, { message: 'the export request was intercepted' }).toBeGreaterThan(0)
  await expect(page.getByRole('alert').filter({ hasText: 'Export failed. Please try again.' })).toBeVisible()
  expect(native, 'no native alert').toEqual([])

  await page.getByRole('button', { name: 'Dismiss' }).click()
  await expect(page.getByText('Export failed. Please try again.')).toHaveCount(0)
})
