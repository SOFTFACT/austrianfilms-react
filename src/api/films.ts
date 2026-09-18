import { apiFetch } from '@softfact/api4d-react'
import type { CompanyRole, CreditRole, Film, FilmCredit, FilmFilters, Paginated } from '../types/film'

function toQuery(f: FilmFilters): string {
  const p = new URLSearchParams()
  const limit = f.limit ?? 100
  p.set('limit', String(limit))
  // FMFilmsController paginates by offset (no `page`); convert page -> offset.
  const offset = f.offset != null ? f.offset : f.page != null ? (f.page - 1) * limit : 0
  p.set('offset', String(offset))
  if (f.search) p.set('q', f.search) // list endpoint accepts `q` for title search
  if (f.sortField) p.set('sortField', f.sortField)
  if (f.sortOrder) p.set('sortOrder', f.sortOrder)
  if (f.genre) p.set('genre', f.genre)
  if (f.filmgenre) p.set('filmgenre', f.filmgenre)
  if (f.director) p.set('director', f.director)
  if (f.production) p.set('production', f.production)
  if (f.yearFrom) p.set('yearFrom', f.yearFrom)
  if (f.yearTo) p.set('yearTo', f.yearTo)
  if (f.actualOnly) p.set('actualOnly', 'true')
  return `?${p.toString().replace(/\+/g, '%20')}`
}

export function getFilms(filters: FilmFilters = {}): Promise<Paginated<Film>> {
  return apiFetch<Paginated<Film>>(`/fmfilms${toQuery(filters)}`)
}

// Single resource: bare entity (no data wrapper). `id` = UUID.
export function getFilm(id: string): Promise<Film> {
  return apiFetch<Film>(`/fmfilms/${id}`)
}

/**
 * Writable film fields accepted by FMFilmsController.applyFieldsFromBody.
 * `titel` + `produktionsjahr` are required on create (validateFilmData).
 * `genre` is the numeric category (1 Fiction / 2 Documentary / 3 Hybrid).
 *
 * People and companies are NOT written here (2026-09-15). The director comes
 * from the credits (the API has ignored `regie` since 2026-09-01), and the
 * legacy free texts `produktion` / `weltvertrieb` are shown read-only: credits
 * go through /fmfilms/:id:credits, companies through /film-contact-rels.
 */
export interface FilmWriteBody {
  titel: string
  produktionsjahr: number
  englischerTitel?: string
  genre?: number
  kategorie?: string
  filmgenre?: string
  betreuung?: string
  /** Whole minutes; null clears it. */
  runningTime?: number | null
  format?: string
  originalsprache?: string
  filmwebsite?: string
  bemerkung?: string
}

/** API envelope returned by the create/update endpoints. */
export interface FilmWriteResult {
  success: boolean
  data?: Film
  message?: string
}

export function createFilm(body: FilmWriteBody): Promise<FilmWriteResult> {
  return apiFetch<FilmWriteResult>('/fmfilms', { method: 'POST', body: JSON.stringify(body) })
}

export function updateFilm(id: string, body: FilmWriteBody): Promise<FilmWriteResult> {
  return apiFetch<FilmWriteResult>(`/fmfilms/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export function deleteFilm(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch<{ success: boolean; message?: string }>(`/fmfilms/${id}`, { method: 'DELETE' })
}

// ── People and companies (Party model) ──────────────────────────────────────

/** Credits of a film; every write below answers with the updated list. */
export function getFilmCredits(filmId: string): Promise<{ data: FilmCredit[] }> {
  return apiFetch<{ data: FilmCredit[] }>(`/fmfilms/${filmId}:credits`)
}

/** Credits a person or collective. The same credit twice is a no-op (`alreadyThere`). */
export function addFilmCredit(
  filmId: string,
  body: { partyId: string; roleId: string },
): Promise<{ data: FilmCredit[]; alreadyThere?: boolean }> {
  return apiFetch(`/fmfilms/${filmId}:credits`, { method: 'POST', body: JSON.stringify(body) })
}

export function removeFilmCredit(filmId: string, creditId: string): Promise<{ data: FilmCredit[] }> {
  return apiFetch(`/fmfilms/${filmId}:credits`, { method: 'DELETE', body: JSON.stringify({ creditId }) })
}

export function getCreditRoles(): Promise<{ data: CreditRole[] }> {
  return apiFetch<{ data: CreditRole[] }>('/fmfilms:creditroles')
}

export function getCompanyRoles(): Promise<{ data: CompanyRole[] }> {
  return apiFetch<{ data: CompanyRole[] }>('/fmfilms:companyroles')
}

/**
 * Links a company to a film in a role. The territory (`countryCode`) is sent
 * only when given — the API demands it for distributors alone, as the 4D mask
 * does. An identical link is returned instead of duplicated.
 */
export function addFilmCompany(
  filmId: string,
  body: { partyId: string; roleId: string; countryCode?: string },
): Promise<unknown> {
  return apiFetch('/film-contact-rels', {
    method: 'POST',
    body: JSON.stringify({
      film_id: filmId,
      kontakt_id: body.partyId,
      role: body.roleId,
      ...(body.countryCode ? { countryCode: body.countryCode } : {}),
    }),
  })
}

/** DELETE answers 204 — apiFetch resolves that to undefined. */
export function removeFilmCompany(relId: string): Promise<void> {
  return apiFetch<void>(`/film-contact-rels/${relId}`, { method: 'DELETE' })
}
