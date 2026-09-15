import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addFilmCompany,
  addFilmCredit,
  getCompanyRoles,
  getCreditRoles,
  getFilmCredits,
  removeFilmCompany,
  removeFilmCredit,
} from '../api/films'

/**
 * People and companies on a film, on the Party model: credits
 * (person_film_rel, keyed by party id) and company roles (film_contact_rel).
 * Every write refreshes the film itself too — its director line and company
 * list are computed from these rows — and the films list.
 */
export function useFilmCredits(filmId: string | undefined) {
  return useQuery({
    queryKey: ['film', filmId, 'credits'],
    queryFn: async () => (await getFilmCredits(filmId!)).data,
    enabled: !!filmId,
  })
}

/** The role catalogues change only with a schema step, so they are fetched once per session. */
export function useCreditRoles() {
  return useQuery({
    queryKey: ['film-roles', 'credit'],
    queryFn: async () => (await getCreditRoles()).data,
    staleTime: Infinity,
  })
}

export function useCompanyRoles() {
  return useQuery({
    queryKey: ['film-roles', 'company'],
    queryFn: async () => (await getCompanyRoles()).data,
    staleTime: Infinity,
  })
}

function useRefreshFilm(filmId: string | undefined) {
  const qc = useQueryClient()
  return async () => {
    // ['film', id] is a prefix of ['film', id, 'credits'], so this covers both.
    await qc.invalidateQueries({ queryKey: ['film', filmId] })
    await qc.invalidateQueries({ queryKey: ['films'] })
  }
}

export function useAddFilmCredit(filmId: string | undefined) {
  const refresh = useRefreshFilm(filmId)
  return useMutation({
    mutationFn: (body: { partyId: string; roleId: string }) => addFilmCredit(filmId!, body),
    onSuccess: refresh,
  })
}

export function useRemoveFilmCredit(filmId: string | undefined) {
  const refresh = useRefreshFilm(filmId)
  return useMutation({
    mutationFn: (creditId: string) => removeFilmCredit(filmId!, creditId),
    onSuccess: refresh,
  })
}

export function useAddFilmCompany(filmId: string | undefined) {
  const refresh = useRefreshFilm(filmId)
  return useMutation({
    mutationFn: (body: { partyId: string; roleId: string; countryCode?: string }) => addFilmCompany(filmId!, body),
    onSuccess: refresh,
  })
}

export function useRemoveFilmCompany(filmId: string | undefined) {
  const refresh = useRefreshFilm(filmId)
  return useMutation({
    mutationFn: (relId: string) => removeFilmCompany(relId),
    onSuccess: refresh,
  })
}
