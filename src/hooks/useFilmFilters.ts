import { useState, useCallback, useMemo } from 'react'
import { EMPTY_FILM_BOX_FILTERS, type FilmBoxFilters } from '../types/film'

/** Local filter-panel state for the films list. */
export function useFilmFilters() {
  const [filters, setFilters] = useState<FilmBoxFilters>(EMPTY_FILM_BOX_FILTERS)

  const update = useCallback(
    <K extends keyof FilmBoxFilters>(key: K, value: FilmBoxFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const clear = useCallback(() => setFilters(EMPTY_FILM_BOX_FILTERS), [])

  const activeCount = useMemo(
    () => Object.values(filters).filter((v) => v !== '').length,
    [filters],
  )

  return { filters, update, clear, activeCount }
}
