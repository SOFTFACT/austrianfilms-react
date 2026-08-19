import { getItineraries } from '../api/itineraries'
import { usePagedList } from '@softfact/api4d-react'
import type { Itinerary, ItineraryFilters } from '../types/itinerary'

export function useItinerariesInfinite(filters: ItineraryFilters = {}) {
  const limit = filters.limit ?? 100
  return usePagedList<Itinerary>({
    queryKey: ['itineraries', 'infinite', { ...filters, limit }],
    fetchPage: (page) => getItineraries({ ...filters, page, limit }),
    getItemId: (i) => i.id,
  })
}
