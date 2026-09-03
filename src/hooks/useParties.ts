import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getParties, getParty, markPartyReviewed, updateParty } from '../api/parties'
import { usePagedList } from '@softfact/api4d-react'
import type { Party, PartyFilters, PartyRow } from '../types/party'

/**
 * Parties as an infinite list. Every filter folds into the query key so a
 * change of search, kind or work list restarts the walk at the first page.
 */
export function usePartiesInfinite(filters: PartyFilters = {}) {
  const limit = filters.limit ?? 100
  return usePagedList<PartyRow>({
    queryKey: ['parties', 'infinite', { ...filters, limit }],
    fetchPage: (page) => getParties({ ...filters, page, limit }),
    getItemId: (p) => p.id,
  })
}

export function useParty(id: string | undefined) {
  return useQuery({
    queryKey: ['party', id],
    queryFn: () => getParty(id!),
    enabled: !!id,
  })
}

/** Saves master data (note, names, …) and refreshes the detail and every list. */
export function useUpdateParty(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Party>) => updateParty(id!, body),
    onSuccess: (party) => {
      qc.setQueryData(['party', id], party)
      void qc.invalidateQueries({ queryKey: ['parties'] })
    },
  })
}

export function useMarkReviewed(id: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markPartyReviewed(id!),
    onSuccess: (party) => {
      qc.setQueryData(['party', id], party)
      void qc.invalidateQueries({ queryKey: ['parties'] })
    },
  })
}
