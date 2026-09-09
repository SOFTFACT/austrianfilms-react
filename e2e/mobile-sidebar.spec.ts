import { test, expect } from '@playwright/test'

/**
 * The two shapes of the shell: below the 768px breakpoint the sidebar is an
 * off-canvas sheet opened from the mobile top bar, above it the collapsible
 * desktop rail. Both hang off useIsMobile, which nothing else covers — and the
 * upstream shadcn version of that hook reported "not mobile" on the first
 * render, so a narrow viewport briefly painted the desktop rail.
 *
 * Note the mobile shell has two navigations: this sheet and the fixed bottom
 * tab bar. A nav link being visible on mobile therefore says nothing about the
 * sheet — scope those assertions to the sheet itself.
 */

test('narrow viewport renders the sidebar as an off-canvas sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/films')
  await expect(page.getByRole('heading', { name: 'Films' })).toBeVisible()

  const sheet = page.locator('[data-slot="sidebar"][data-mobile="true"]')

  // Mobile mode: no desktop rail, and the sheet is not mounted until opened.
  await expect(page.locator('[data-slot="sidebar-container"]')).toHaveCount(0)
  await expect(sheet).toHaveCount(0)

  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('link', { name: 'Festivals' })).toBeVisible()
})

test('wide viewport renders the desktop rail, no sheet', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/films')

  await expect(page.locator('[data-slot="sidebar-container"]')).toBeVisible()
  await expect(page.locator('[data-slot="sidebar"][data-mobile="true"]')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Festivals' })).toBeVisible()
})
