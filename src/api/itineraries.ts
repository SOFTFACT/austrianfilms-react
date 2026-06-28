import { apiFetch } from '@/lib/api4d'
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
    return apiFetch<Paginated<Itinerary>>(
      `/itineraries:search?q=${encodeURIComponent(filters.search)}&${p.toString().replace(/\+/g, '%20')}`,
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
  return apiFetch<Paginated<Itinerary>>(`/itineraries?${p.toString().replace(/\+/g, '%20')}`)
}

/** Create an itinerary. Requires fk_film + fk_festival (UUIDs); other fields
 *  optional. Returns the API envelope {success, data, message}. */
export interface NewItineraryBody {
  fk_film: string
  fk_festival: string
  statusExtern?: string
  land?: string
  von?: string
  bis?: string
  sektion?: string
  submissionVia?: string
  screeningFee?: string
  notesPublic?: string
  notesInternal?: string
}

export function createItinerary(body: NewItineraryBody): Promise<{ success: boolean; data?: Itinerary; message?: string }> {
  return apiFetch<{ success: boolean; data?: Itinerary; message?: string }>('/itineraries', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
