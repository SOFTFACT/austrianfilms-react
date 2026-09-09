import { test, expect } from '@playwright/test'

/**
 * Films list — the shared list driver (useInfiniteList), the search box, the
 * sortable column headers and the expandable row detail.
 *
 * Read-only: nothing here creates or changes a record. Assertions avoid fixed
 * record counts so they survive a changing data set; they pin behaviour
 * instead (does it page? does sorting reach the server? does a row expand?).
 */

const rows = (page: import('@playwright/test').Page) => page.getByRole('row')
const search = (page: import('@playwright/test').Page) => page.getByPlaceholder('Search title…')

/** "2.478 total" → 2478. */
async function total(page: import('@playwright/test').Page): Promise<number> {
  const text = (await page.getByText(/^[\d.,]+ total$/).first().textContent()) ?? ''
  return Number(text.replace(/[^\d]/g, ''))
}

test.beforeEach(async ({ page }) => {
  await page.goto('/app/films')
  await expect(page.getByRole('heading', { name: 'Films' })).toBeVisible()
  await expect(rows(page).first()).toBeVisible({ timeout: 30_000 })
})

test('the list loads rows and reports a total', async ({ page }) => {
  expect(await total(page)).toBeGreaterThan(0)
  expect(await rows(page).count()).toBeGreaterThan(0)
})

test('scrolling to the end requests the next page', async ({ page }) => {
  // The list is virtualized, so the DOM row count stays flat as you scroll —
  // the honest signal that paging happened is the follow-up request.
  const nextPage = page.waitForRequest(
    (r) => r.url().includes('/api/v1/fmfilms') && /offset=(?!0\b)\d+/.test(r.url()),
    { timeout: 30_000 },
  )

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

  await nextPage
})

test('searching narrows the total', async ({ page }) => {
  const before = await total(page)

  // The list opens with "current only" (DEFAULT_FILM_BOX_FILTERS), so a fixed
  // term such as "Cosmos" may not be among the current films at all. Ask the
  // API for a title that IS in the default view and search for that one.
  const token = await page.evaluate(() => localStorage.getItem('austrianfilms_token'))
  const res = await page.request.get('/api/v1/fmfilms?actualOnly=true&limit=1', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const title = ((await res.json()) as { data: { titel: string }[] }).data[0]?.titel?.trim() ?? ''
  expect(title.length).toBeGreaterThan(1)

  await search(page).fill(title)

  await expect.poll(async () => total(page), { timeout: 30_000 }).toBeLessThan(before)
  expect(await total(page)).toBeGreaterThan(0)
})

test('a multi-word search still finds films', async ({ page }) => {
  // Regression guard: URLSearchParams encodes a space as '+', which 4D reads
  // literally — a multi-word search then returned zero hits until the client
  // started forcing %20 (see the .replace(/\+/g, '%20') in api/films.ts).
  await search(page).fill('Die Welt')

  await expect.poll(async () => total(page), { timeout: 30_000 }).toBeGreaterThan(0)
  await expect(page.getByText('No films found.')).toHaveCount(0)
})

test('the search box keeps focus across the debounced refetch', async ({ page }) => {
  const box = search(page)
  await box.click()
  await box.pressSequentially('Cosmos', { delay: 60 })

  await expect.poll(async () => total(page), { timeout: 30_000 }).toBeGreaterThan(0)
  await expect(box).toBeFocused()
})

test('a column header click asks the server for that sort field', async ({ page }) => {
  const request = page.waitForRequest(
    (r) => r.url().includes('/api/v1/fmfilms') && /sortField=titel/.test(r.url()),
    { timeout: 30_000 },
  )

  await page.getByRole('button', { name: 'Title' }).click()

  await request
})

test('clicking the active header flips the sort order', async ({ page }) => {
  // Arm the waiter BEFORE clicking — the request fires immediately, and a
  // waitForRequest registered afterwards misses it and runs into its timeout.
  const ascending = page.waitForRequest(
    (r) => r.url().includes('/api/v1/fmfilms') && /sortField=titel/.test(r.url()),
    { timeout: 30_000 },
  )
  await page.getByRole('button', { name: 'Title' }).click()
  await ascending

  const descending = page.waitForRequest(
    (r) =>
      r.url().includes('/api/v1/fmfilms') &&
      /sortField=titel/.test(r.url()) &&
      /sortOrder=desc/.test(r.url()),
    { timeout: 30_000 },
  )
  await page.getByRole('button', { name: 'Title' }).click()

  await descending
})

test('a row expands into its detail and opens the film', async ({ page }) => {
  const first = rows(page).first()
  await expect(first).toHaveAttribute('aria-expanded', 'false')

  await first.click()
  await expect(first).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: 'Open film' }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Open film' }).first().click()
  await expect(page).toHaveURL(/\/films\/[^/]+$/)
})
