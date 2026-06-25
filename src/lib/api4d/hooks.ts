import { useEffect, useState } from 'react'
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { getStoredToken } from './AuthContext'
import type { PagedResponse } from './types'

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

/** Cursor (string) for cursor-mode endpoints, offset (number) for
 *  offset-mode endpoints, null on the first page. The fetcher
 *  inspects `typeof` to decide which it received. */
export type PageParam = string | number | null

interface UseInfiniteListOptions<T> {
  queryKey: QueryKey
  /** Fetch one page. Receives the previous page's cursor (string),
   *  offset (number), or null on page 1. */
  fetchPage: (param: PageParam) => Promise<PagedResponse<T>>
  enabled?: boolean
  /** Stable identity per row — drops duplicates that slip in across pages. */
  getItemId?: (item: T) => string | number
}

/**
 * Infinite list driver — walks any list endpoint that returns the API4D
 * pagination envelope, regardless of whether it runs in cursor mode
 * (preferred, see CURSOR_PAGINATION.md) or offset mode.
 *
 * Page-param strategy:
 * - `pagination.nextCursor` set → forward it as the next cursor string.
 * - `pagination.nextCursor` null but `hasNext` true → compute the next
 *   offset from `offset + limit`. Stable enough for read-mostly lists;
 *   cursor mode is still the right choice when concurrent inserts could
 *   shift offsets mid-scroll.
 * - Neither → end of list, no further fetches.
 */
export function useInfiniteList<T>(opts: UseInfiniteListOptions<T>) {
  const q = useInfiniteQuery({
    queryKey: opts.queryKey,
    queryFn: ({ pageParam }) => opts.fetchPage(pageParam as PageParam),
    initialPageParam: null as PageParam,
    getNextPageParam: (last) => {
      if (last.pagination.nextCursor) return last.pagination.nextCursor
      if (last.pagination.hasNext) {
        return (last.pagination.offset ?? 0) + (last.pagination.limit ?? 0)
      }
      return null
    },
    enabled: (opts.enabled ?? true) && !!getStoredToken(),
  })

  const items: T[] = []
  if (q.data?.pages) {
    if (opts.getItemId) {
      const seen = new Set<string | number>()
      for (const page of q.data.pages) {
        for (const it of page.data) {
          const id = opts.getItemId(it)
          if (!seen.has(id)) {
            seen.add(id)
            items.push(it)
          }
        }
      }
    } else {
      for (const page of q.data.pages) items.push(...page.data)
    }
  }

  return {
    items,
    total: q.data?.pages?.[0]?.pagination.total ?? items.length,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    isFetchingNextPage: q.isFetchingNextPage,
    hasNextPage: q.hasNextPage,
    fetchNextPage: q.fetchNextPage,
    error: q.error,
  }
}
