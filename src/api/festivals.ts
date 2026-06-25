import { apiFetch } from '@/lib/api4d'
import type { Festival, FestivalFilters } from '../types/festival'
import type { Paginated } from '../types/common'

export function getFestivals(filters: FestivalFilters = {}): Promise<Paginated<Festival>> {
  const limit = filters.limit ?? 100
  const offset =
    filters.offset != null ? filters.offset : filters.page != null ? (filters.page - 1) * limit : 0
  const p = new URLSearchParams()
  p.set('limit', String(limit))
  p.set('offset', String(offset))

  // The /festivals list endpoint only allows limit/offset/sort; full-text
  // search has its own :search route (no sort params there).
  if (filters.search) {
    return apiFetch<Paginated<Festival>>(
      `/festivals:search?q=${encodeURIComponent(filters.search)}&${p.toString()}`,
    )
  }
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortOrder) p.set('sortOrder', filters.sortOrder)
  return apiFetch<Paginated<Festival>>(`/festivals?${p.toString()}`)
}

export function getFestival(id: string): Promise<Festival> {
  return apiFetch<Festival>(`/festivals/${id}`)
}
