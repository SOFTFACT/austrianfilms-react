import { test, expect, type Page } from '@playwright/test'

/**
 * App frame: the window never scrolls, <main data-testid="app-scroll"> is the
 * one scroll container (scroll behaviour from @softfact/react-kit).
 *
 * Read-only. Positions are only asserted where the data set is long enough;
 * a shorter one skips instead of passing on an unscrollable page.
 */

const main = (page: Page) => page.getByTestId('app-scroll')

async function openFilms(page: Page) {
  await page.goto('/films')
  await expect(page.getByRole('heading', { name: 'Films' })).toBeVisible()
  await expect(page.getByRole('row').first()).toBeVisible({ timeout: 30_000 })
}

async function scrollMainTo(page: Page, top: number) {
  const max = await main(page).evaluate((el) => el.scrollHeight - el.clientHeight)
  test.skip(max < top, `data set too short to scroll to ${top} (max ${max})`)
  await main(page).evaluate((el, t) => el.scrollTo(0, t), top)
  expect(await main(page).evaluate((el) => el.scrollTop)).toBe(top)
}

test('the window never scrolls; <main> is the scroll container', async ({ page }) => {
  await openFilms(page)
  const doc = await page.evaluate(() => ({
    scroll: document.scrollingElement!.scrollHeight,
    viewport: window.innerHeight,
  }))
  expect(doc.scroll).toBeLessThanOrEqual(doc.viewport + 1)
  const m = await main(page).evaluate((el) => ({ scroll: el.scrollHeight, client: el.clientHeight }))
  expect(m.scroll).toBeGreaterThan(m.client)
})

test('the sticky list header stays pinned to the top of the container', async ({ page }) => {
  await openFilms(page)
  await scrollMainTo(page, 800)
  const gap = await page.evaluate(() => {
    const m = document.querySelector('[data-testid="app-scroll"]')!
    return Math.round(m.querySelector('.sticky')!.getBoundingClientRect().top - m.getBoundingClientRect().top)
  })
  expect(gap).toBe(0)
})

test('forward navigation starts at the top, back returns to the left position', async ({ page }) => {
  await openFilms(page)
  await scrollMainTo(page, 800)
  // Let the position be recorded before leaving.
  await page.waitForTimeout(100)
  await page.getByRole('link', { name: 'Festivals' }).first().click()
  await expect(page.getByRole('heading', { name: 'Festivals' })).toBeVisible()
  expect(await main(page).evaluate((el) => el.scrollTop)).toBe(0)
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Films' })).toBeVisible()
  await expect.poll(() => main(page).evaluate((el) => el.scrollTop), { timeout: 10_000 }).toBe(800)
})

test('a reload lands where the list was left', async ({ page }) => {
  await openFilms(page)
  await scrollMainTo(page, 800)
  await page.waitForTimeout(100)
  await page.reload()
  await expect(page.getByRole('row').first()).toBeVisible({ timeout: 30_000 })
  await expect.poll(() => main(page).evaluate((el) => el.scrollTop), { timeout: 15_000 }).toBe(800)
})

test('scrolling the container to the end requests the next page', async ({ page }) => {
  await openFilms(page)
  const nextPage = page.waitForRequest(
    (r) => r.url().includes('/api/v1/fmfilms') && /offset=(?!0\b)\d+/.test(r.url()),
    { timeout: 30_000 },
  )
  await main(page).evaluate((el) => el.scrollTo(0, el.scrollHeight))
  await nextPage
})

test.describe('phone width', () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true })

  // The frame clips horizontally (the document no longer scrolls sideways),
  // so every list toolbar control must fit the screen. Before the frame, a
  // too-wide toolbar merely made the page pannable; now it would hide
  // "Filters", "Expand all" and the export out of reach.
  for (const [path, heading] of [
    ['/films', 'Films'],
    ['/festivals', 'Festivals'],
    ['/itineraries', 'Itineraries'],
    ['/parties', 'Contacts'],
  ] as const) {
    test(`${heading}: every toolbar control is within the screen`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      const out = await page.evaluate(() => {
        const bar = document.querySelector('[data-testid="app-scroll"] .sticky')!
        return [...bar.querySelectorAll('button, input, a')]
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.right > innerWidth + 0.5 || r.left < -0.5))
          .map(({ el, r }) => `${(el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.tagName).trim()} [${Math.round(r.left)}..${Math.round(r.right)}]`)
      })
      // Counter-check that the query sees the toolbar at all.
      expect(await page.locator('[data-testid="app-scroll"] .sticky button').count()).toBeGreaterThan(0)
      expect(out).toEqual([])
    })
  }
})
