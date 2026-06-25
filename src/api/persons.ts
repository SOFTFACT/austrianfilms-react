import { apiFetch } from '@/lib/api4d'
import type { Person, PersonFilters } from '../types/person'
import type { Paginated } from '../types/common'

export function getPersons(filters: PersonFilters = {}): Promise<Paginated<Person>> {
  const limit = filters.limit ?? 100
  const offset =
    filters.offset != null ? filters.offset : filters.page != null ? (filters.page - 1) * limit : 0
  const p = new URLSearchParams()
  p.set('limit', String(limit))
  p.set('offset', String(offset))

  // Full-text search has its own :search route (no category filter there).
  if (filters.search) {
    if (filters.sortField) p.set('sortField', filters.sortField)
    if (filters.sortOrder) p.set('sortOrder', filters.sortOrder)
    return apiFetch<Paginated<Person>>(
      `/persons:search?q=${encodeURIComponent(filters.search)}&${p.toString()}`,
    )
  }
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortOrder) p.set('sortOrder', filters.sortOrder)
  if (filters.category) p.set('category', filters.category)
  return apiFetch<Paginated<Person>>(`/persons?${p.toString()}`)
}

export function getPerson(id: string): Promise<Person> {
  return apiFetch<Person>(`/persons/${id}`)
}
