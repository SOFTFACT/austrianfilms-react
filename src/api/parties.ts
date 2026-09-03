import { apiFetch } from '@softfact/api4d-react'
import type { Party, PartyFilters, PartyRow } from '../types/party'
import type { Paginated } from '../types/common'

/**
 * GET /api/v1/parties -- one route for everything: search (name, folded for
 * German transliteration), kind and work list are query parameters, so
 * unlike the old persons API there is no second :search route to switch to.
 */
export function getParties(filters: PartyFilters = {}): Promise<Paginated<PartyRow>> {
  const limit = filters.limit ?? 100
  const offset =
    filters.offset != null ? filters.offset : filters.page != null ? (filters.page - 1) * limit : 0
  const p = new URLSearchParams()
  p.set('limit', String(limit))
  p.set('offset', String(offset))
  if (filters.search) p.set('search', filters.search)
  if (filters.kind) p.set('kind', filters.kind)
  if (filters.workset) p.set('workset', filters.workset)
  if (filters.sortField) p.set('sortField', filters.sortField)
  if (filters.sortOrder) p.set('sortOrder', filters.sortOrder)
  return apiFetch<Paginated<PartyRow>>(`/parties?${p.toString().replace(/\+/g, '%20')}`)
}

export function getParty(id: string): Promise<Party> {
  return apiFetch<Party>(`/parties/${id}`)
}

/** PUT /api/v1/parties/:id -- master data; unknown keys come back in ignoredFields. */
export function updateParty(id: string, body: Partial<Party> & { reviewed?: boolean }): Promise<Party> {
  return apiFetch<Party>(`/parties/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

/** Closes the case: sets reviewedAt/By the way the 4D mask's "Checked" button does. */
export function markPartyReviewed(id: string): Promise<Party> {
  return updateParty(id, { reviewed: true })
}
