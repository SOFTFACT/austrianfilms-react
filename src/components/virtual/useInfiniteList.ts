import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getToken } from '../../contexts/auth'

/**
 * Page-shape every ECOline collection endpoint emits (cs.API4D.Response).
 * Note: ECOline uses page/offset pagination, NOT the cursor pagination
 * artdimensions uses — so this driver walks `page + 1` while `hasNext`,
 * instead of following a `nextCursor`.
 */
export interface PagedResult<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    pages: number
    hasNext: boolean
  }
}

export interface UseInfiniteListOptions<T> {
  /** Folded into React Query's cache key. Any change restarts at page 1. */
  queryKey: QueryKey
  /** Fetch one page (1-based). */
  fetchPage: (page: number) => Promise<PagedResult<T>>
  enabled?: boolean
  /** Stable identity per row — dedups overlaps across pages before the
   *  virtualizer sees them. */
  getItemId?: (item: T) => string | number
}

export interface UseInfiniteListResult<T> {
  items: T[]
  total: number
  isLoading: boolean
  isFetching: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  fetchNextPage: () => Promise<unknown>
  error: Error | null
}

/**
 * Page-based infinite list driver. Wraps useInfiniteQuery so every list
 * page (Kunden, later Artikel/Geschäftsfälle) shares one implementation.
 * Auth-gated via getToken so the fetch is skipped before login.
 */
export function useInfiniteList<T>({
  queryKey,
  fetchPage,
  enabled = true,
  getItemId,
}: UseInfiniteListOptions<T>): UseInfiniteListResult<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.pagination.hasNext ? last.pagination.page + 1 : undefined),
    enabled: enabled && !!getToken(),
    // Keep the previous result while a query-key change is in flight, so a
    // keystroke in the search box doesn't flip isLoading and unmount the
    // input (focus loss). Doesn't affect fetchNextPage (appends pages).
    placeholderData: (prev) => prev,
  })

  const items = useMemo(() => {
    const pages = query.data?.pages ?? []
    if (!getItemId) return pages.flatMap((p) => p.data)
    const seen = new Set<string | number>()
    const result: T[] = []
    for (const p of pages) {
      for (const item of p.data) {
        const id = getItemId(item)
        if (seen.has(id)) continue
        seen.add(id)
        result.push(item)
      }
    }
    return result
  }, [query.data, getItemId])

  const total = query.data?.pages[0]?.pagination.total ?? items.length

  return {
    items,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  }
}
