import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { getStoredToken } from './authState'
import type { PagedResponse, Pagination } from './types'

/**
 * Debounce a value — pause N ms after the last change before propagating.
 * Standard search-input companion.
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

/** Cursor (string) for cursor-mode endpoints, offset or 1-based page number
 *  (both number) for the other modes, null on the first page of a
 *  cursor/offset walk. The fetcher inspects `typeof` to decide which it got. */
export type PageParam = string | number | null

/**
 * How to ask for the next page:
 * - `"auto"` (default): follow `nextCursor` when the endpoint sends one,
 *   otherwise compute `offset + limit`.
 * - `"page"`: walk 1-based page numbers (`page + 1` while `hasNext`). Pick this
 *   when the endpoint is paged rather than cursored — the fetcher then always
 *   receives a page number, starting at 1.
 */
type PageMode = 'auto' | 'page'

interface ListOptions<T, P extends Pagination, Param> {
  queryKey: QueryKey
  /** Fetch one page. */
  fetchPage: (param: Param) => Promise<PagedResponse<T, P>>
  enabled?: boolean
  /** Stable identity per row — drops duplicates that slip in across pages. */
  getItemId?: (item: T) => string | number
}

/** Options for the cursor/offset driver — the fetcher gets a cursor, an offset,
 *  or null on the first page. */
export type UseInfiniteListOptions<T, P extends Pagination = Pagination> = ListOptions<
  T,
  P,
  PageParam
>

/** Options for the page-number driver — the fetcher always gets a 1-based page. */
export type UsePagedListOptions<T, P extends Pagination = Pagination> = ListOptions<T, P, number>

/**
 * Shared implementation behind useInfiniteList and usePagedList. Walks any list
 * endpoint that returns the API4D pagination envelope; only the way the next
 * page is requested differs between the two.
 *
 * The first page's raw `pagination` object is returned as-is, so endpoints that
 * put extra aggregates in there (totals over the whole filtered set, for
 * instance) stay accessible without this library knowing about them: type the
 * hook with your own Pagination subtype.
 */
function useListDriver<T, P extends Pagination>(
  opts: ListOptions<T, P, never> | ListOptions<T, P, PageParam> | ListOptions<T, P, number>,
  mode: PageMode,
) {
  const fetchPage = opts.fetchPage as (param: PageParam) => Promise<PagedResponse<T, P>>
  const q = useInfiniteQuery({
    queryKey: opts.queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam as PageParam),
    initialPageParam: (mode === 'page' ? 1 : null) as PageParam,
    getNextPageParam: (last, _all, lastPageParam) => {
      if (mode === 'page') {
        const pg = last.pagination
        // Prefer hasNext; fall back to page < pages for endpoints that omit it.
        const more = pg.hasNext != null ? pg.hasNext : pg.page < pg.pages
        return more ? pg.page + 1 : null
      }
      // Backend-safety: if the server hands back the very param it was given,
      // the virtualizer's scroll trigger would refire forever on the same
      // query. Observed with cursors that don't advance when a sort field
      // holds empty values. Treat a non-advancing param as end-of-list so
      // paging stops instead of hammering the API. Same guard for the offset
      // walk, which stalls the same way if the endpoint reports limit 0.
      const stop = (next: PageParam) => (next === lastPageParam ? null : next)
      if (last.pagination.nextCursor) return stop(last.pagination.nextCursor)
      if (last.pagination.hasNext) {
        return stop((last.pagination.offset ?? 0) + (last.pagination.limit ?? 0))
      }
      return null
    },
    enabled: (opts.enabled ?? true) && !!getStoredToken(),
    // Keep the previous result while a query-key change is in flight, so a
    // keystroke in the search box doesn't flip isLoading and unmount the input
    // (which would cost the focus). Doesn't affect fetchNextPage, which appends.
    placeholderData: (prev) => prev,
  })

  const { getItemId } = opts
  const items = useMemo(() => {
    const pages = q.data?.pages ?? []
    if (!getItemId) return pages.flatMap((p) => p.data)
    const seen = new Set<string | number>()
    const out: T[] = []
    for (const page of pages) {
      for (const it of page.data) {
        const id = getItemId(it)
        if (seen.has(id)) continue
        seen.add(id)
        out.push(it)
      }
    }
    return out
  }, [q.data, getItemId])

  const pagination = q.data?.pages?.[0]?.pagination

  return {
    items,
    total: pagination?.total ?? items.length,
    /** Raw pagination of the first page — read endpoint-specific extras here. */
    pagination,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    isFetchingNextPage: q.isFetchingNextPage,
    hasNextPage: q.hasNextPage,
    fetchNextPage: q.fetchNextPage,
    error: q.error,
  }
}

/**
 * Infinite list over a cursor- or offset-paged endpoint.
 *
 * - `pagination.nextCursor` set → forward it as the next cursor.
 * - `nextCursor` null but `hasNext` true → compute `offset + limit`. Fine for
 *   read-mostly lists; prefer cursors when concurrent inserts could shift
 *   offsets mid-scroll.
 * - Neither → end of list.
 *
 * The fetcher receives a cursor, an offset, or null on the first page.
 */
export function useInfiniteList<T, P extends Pagination = Pagination>(
  opts: UseInfiniteListOptions<T, P>,
) {
  return useListDriver<T, P>(opts, 'auto')
}

/**
 * Infinite list over an endpoint paged by 1-based page number: walks `page + 1`
 * while `hasNext`. The fetcher always receives a number, starting at 1.
 */
export function usePagedList<T, P extends Pagination = Pagination>(
  opts: UsePagedListOptions<T, P>,
) {
  return useListDriver<T, P>(opts, 'page')
}
