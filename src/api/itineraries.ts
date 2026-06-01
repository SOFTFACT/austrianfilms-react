import { apiClient } from './client'
import type { Itinerary, ItineraryFilters } from '../types/itinerary'
import type { Paginated } from '../types/common'

export function getItineraries(filters: ItineraryFilters = {}): Promise<Paginated<Itinerary>> {
  const limit = filters.limit ?? 100
  const offset =
    filters.offset != null ? filters.offset : filters.page != null ? (filters.page - 1) * limit : 0
  const p = new URLSearchParams()
  p.set('limit', String(limit))
  p.set('offset', String(offset))

  // Full-text search has its own :search route (filters not supported there);
  // when no search term, the list route accepts status/country/date/premiere.
  if (filters.search) {
    if (filters.sortField) p.set('sortField', filters.sortField)
    if (filters.sortOrder) p.set('sortOrder', filters.sortOrder)
    return apiClient.get<Paginated<Itinerary>>(
      `/itineraries:search?q=${encodeURIComponent(filters.search)}&${p.toString()}`,
    )
  }

  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortOrder) p.set('sortOrder', filters.sortOrder)
  if (filters.status) p.set('status', filters.status)
  if (filters.country) p.set('country', filters.country)
  if (filters.dateField && (filters.dateFrom || filters.dateTo)) {
    p.set('dateField', filters.dateField)
    if (filters.dateFrom) p.set('dateFrom', filters.dateFrom)
    if (filters.dateTo) p.set('dateTo', filters.dateTo)
  }
  if (filters.premiereIntl) p.set('premiereIntl', 'true')
  if (filters.premiereLocal) p.set('premiereLocal', 'true')
  return apiClient.get<Paginated<Itinerary>>(`/itineraries?${p.toString()}`)
}
