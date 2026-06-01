/** Pagination wrapper emitted by every collection endpoint (cs.API4D.Response). */
export interface Paginated<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    pages: number
    hasNext: boolean
    hasPrev?: boolean
  }
}
