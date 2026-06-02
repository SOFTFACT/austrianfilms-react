import type { Paginated } from '../types/common'

interface FetchAllOptions {
  /** Rows per request. The AF list endpoints cap server-side at 500. */
  pageSize?: number
  /** Hard safety cap so an unfiltered export can't fire hundreds of requests. */
  cap?: number
  /** Called after each page with the running row count and the known total. */
  onProgress?: (loaded: number, total: number) => void
}

export interface FetchAllResult<T> {
  rows: T[]
  total: number
  /** True when `cap` was hit before all rows were fetched. */
  truncated: boolean
}

/**
 * Page through a paginated list endpoint until every matching row is collected
 * (or the safety cap is hit). `fetchPage` receives offset + limit and returns
 * the standard Paginated envelope. Used to export the full filtered result set,
 * not just the rows currently loaded in the virtual list.
 */
export async function fetchAllPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<Paginated<T>>,
  opts: FetchAllOptions = {},
): Promise<FetchAllResult<T>> {
  const pageSize = opts.pageSize ?? 500
  const cap = opts.cap ?? 20000
  const rows: T[] = []
  let offset = 0
  let total = 0

  for (;;) {
    const page = await fetchPage(offset, pageSize)
    total = page.pagination.total
    rows.push(...page.data)
    opts.onProgress?.(rows.length, Math.min(total, cap))

    if (rows.length >= cap && rows.length < total) {
      return { rows: rows.slice(0, cap), total, truncated: true }
    }
    if (rows.length >= total || page.data.length === 0) {
      return { rows, total, truncated: false }
    }
    offset += pageSize
  }
}
