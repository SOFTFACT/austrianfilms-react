import { getItineraries } from '../api/itineraries'
import { useInfiniteList } from '../components/virtual'
import type { Itinerary, ItineraryFilters } from '../types/itinerary'

export function useItinerariesInfinite(filters: ItineraryFilters = {}) {
  const limit = filters.limit ?? 100
  return useInfiniteList<Itinerary>({
    queryKey: ['itineraries', 'infinite', { ...filters, limit }],
    fetchPage: (page) => getItineraries({ ...filters, page, limit }),
    getItemId: (i) => i.id,
  })
}
