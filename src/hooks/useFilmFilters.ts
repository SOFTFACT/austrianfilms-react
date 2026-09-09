import { useState, useCallback, useMemo } from 'react'
import { DEFAULT_FILM_BOX_FILTERS, type FilmBoxFilters } from '../types/film'

/** Local filter-panel state for the films list. */
export function useFilmFilters() {
  const [filters, setFilters] = useState<FilmBoxFilters>(DEFAULT_FILM_BOX_FILTERS)

  const update = useCallback(
    <K extends keyof FilmBoxFilters>(key: K, value: FilmBoxFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const clear = useCallback(() => setFilters(DEFAULT_FILM_BOX_FILTERS), [])

  // Counts what differs from the DEFAULT, not from empty — the standard
  // "current only" must not read as an active filter on a fresh list.
  const activeCount = useMemo(
    () =>
      (Object.keys(filters) as (keyof FilmBoxFilters)[]).filter(
        (k) => filters[k] !== DEFAULT_FILM_BOX_FILTERS[k],
      ).length,
    [filters],
  )

  return { filters, update, clear, activeCount }
}
