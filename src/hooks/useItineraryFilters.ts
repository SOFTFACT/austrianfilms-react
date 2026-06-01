import { useState, useCallback, useMemo } from 'react'
import { EMPTY_ITINERARY_BOX_FILTERS, type ItineraryBoxFilters } from '../types/itinerary'

/** Local filter-drawer state for the itineraries list. */
export function useItineraryFilters() {
  const [filters, setFilters] = useState<ItineraryBoxFilters>(EMPTY_ITINERARY_BOX_FILTERS)

  const update = useCallback(
    <K extends keyof ItineraryBoxFilters>(key: K, value: ItineraryBoxFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const clear = useCallback(() => setFilters(EMPTY_ITINERARY_BOX_FILTERS), [])

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v !== '' && v !== false).length,
    [filters],
  )

  return { filters, update, clear, activeCount }
}
