import { useQuery } from '@tanstack/react-query'
import { getPersons, getPerson } from '../api/persons'
import { useInfiniteList } from '../components/virtual'
import type { Person, PersonFilters } from '../types/person'

export function usePersonsInfinite(filters: PersonFilters = {}) {
  const limit = filters.limit ?? 100
  return useInfiniteList<Person>({
    queryKey: ['persons', 'infinite', { ...filters, limit }],
    fetchPage: (page) => getPersons({ ...filters, page, limit }),
    getItemId: (p) => p.id,
  })
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: () => getPerson(id!),
    enabled: !!id,
  })
}
