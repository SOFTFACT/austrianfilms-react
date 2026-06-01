import { useQuery } from '@tanstack/react-query'
import { getFestivals, getFestival } from '../api/festivals'
import { useInfiniteList } from '../components/virtual'
import type { Festival, FestivalFilters } from '../types/festival'

export function useFestivalsInfinite(filters: FestivalFilters = {}) {
  const limit = filters.limit ?? 100
  return useInfiniteList<Festival>({
    queryKey: ['festivals', 'infinite', { ...filters, limit }],
    fetchPage: (page) => getFestivals({ ...filters, page, limit }),
    getItemId: (f) => f.id,
  })
}

export function useFestival(id: string | undefined) {
  return useQuery({
    queryKey: ['festival', id],
    queryFn: () => getFestival(id!),
    enabled: !!id,
  })
}
