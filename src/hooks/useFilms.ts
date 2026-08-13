import { useQuery } from '@tanstack/react-query'
import { getFilms, getFilm } from '../api/films'
import { usePagedList } from '@/lib/api4d'
import type { Film, FilmFilters } from '../types/film'

/**
 * Films as an infinite list (page-based driver; the films API converts page
 * to the offset the FMFilmsController expects). Every filter folds into the
 * query key so a search restarts the walk at the first page.
 */
export function useFilmsInfinite(filters: FilmFilters = {}) {
  const limit = filters.limit ?? 100
  return usePagedList<Film>({
    queryKey: ['films', 'infinite', { ...filters, limit }],
    fetchPage: (page) => getFilms({ ...filters, page, limit }),
    getItemId: (f) => f.id,
  })
}

export function useFilm(id: string | undefined) {
  return useQuery({
    queryKey: ['film', id],
    queryFn: () => getFilm(id!),
    enabled: !!id,
  })
}
