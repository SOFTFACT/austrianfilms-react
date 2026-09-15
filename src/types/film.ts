/**
 * Film -- output shape of cs.FMFilmsController.filmToObject / filmToObjectFull
 * (GET /api/v1/fmfilms[/:id]). DB-faithful German attribute names are legacy
 * schema; `id` is the UUID (primarschlussel).
 */
export interface Film {
  id: string
  titel: string
  englischerTitel: string
  produktionsjahr: number
  /** Director names, read from the director credits (Party). Read-only. */
  regie: string
  /** Legacy free text X_regie (JART) — read-only, shown as legacy data. */
  regieLegacy?: string
  /** Legacy free text — read-only; the linked companies are productionCompanies. */
  produktion: string
  kategorie: string
  filmgenre: string
  genre: number
  genreText: string
  betreuung: string
  sourceJART: boolean
  imageUrl: string
  // Detail-only fields (filmToObjectFull).
  format?: string
  minuten?: number
  originalsprache?: string
  weltvertrieb?: string
  finanziert?: string
  betreuungsjahr?: number
  preise?: string
  filmwebsite?: string
  bemerkung?: string
  /** Austrian producer as display text (Party, legacy text as fallback). */
  produktionDisplay?: string
  /** Every company linked to the film, in role order (film_contact_rel → Party). */
  productionCompanies?: FilmCompany[]
}

/** One person or collective credited on a film (GET /fmfilms/:id:credits). */
export interface FilmCredit {
  creditId: string
  /** Party id — links to /parties/:id. */
  partyId: string
  name: string
  kind: 'person' | 'organization' | 'group'
  /** person_kategorie id. */
  roleId: string
  /** Readable role name ("Director", "Cast", …). */
  role: string
  sortValue: number
}

/** A company linked to a film in a role (film_contact_rel). */
export interface FilmCompany {
  /** film_contact_rel id — DELETE /film-contact-rels/:relId. */
  relId: string
  /** Party id — links to /parties/:id. */
  partyId: string
  name: string
  /** Stored role UUID. */
  role: string
  /** Readable role name ("Austrian producer", …). */
  roleName: string
  roleOrder: number
  /** Territory — distributors only, empty for the other roles. */
  countryCode: string
}

/** GET /fmfilms:creditroles — `selectable` false: shown, but not offered for new credits. */
export interface CreditRole {
  id: string
  name: string
  sortValue: number
  selectable: boolean
}

/** GET /fmfilms:companyroles — `territoryRequired`: only a distributor row needs a country. */
export interface CompanyRole {
  id: string
  code: 'AT_PRODUCER' | 'CO_PRODUCER' | 'WORLD_SALES' | 'DISTRIBUTOR'
  name: string
  territoryRequired: boolean
}

/** Pagination wrapper of every collection endpoint (cs.API4D.Response). */
export interface Paginated<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    page: number
    pages: number
    hasNext: boolean
    hasPrev?: boolean
  }
}

/** Query params accepted by the FMFilmsController list whitelist. */
export interface FilmFilters {
  search?: string
  limit?: number
  offset?: number
  page?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  genre?: string
  filmgenre?: string
  director?: string
  production?: string
  yearFrom?: string
  yearTo?: string
  actualOnly?: boolean
}

/** Filter-panel box filters (all strings for the inputs). */
export interface FilmBoxFilters {
  /** Genre category: '' | '1' Fiction | '2' Documentary | '3' Hybrid. */
  genre: '' | '1' | '2' | '3'
  director: string
  filmgenre: string
  production: string
  yearFrom: string
  yearTo: string
  actualOnly: '' | 'true'
}

export const EMPTY_FILM_BOX_FILTERS: FilmBoxFilters = {
  genre: '',
  director: '',
  filmgenre: '',
  production: '',
  yearFrom: '',
  yearTo: '',
  actualOnly: '',
}

/**
 * What the films list opens with: every film, no filter. From 2026-09-09 to
 * 2026-09-15 it opened with "current only", and a title search then missed
 * every film without an AF status ("Spacehasen TOS": 1 hit without the
 * filter, 0 with it) — the editors read that as "search does not find it".
 * "Current only" stays one ticked checkbox away.
 */
export const DEFAULT_FILM_BOX_FILTERS: FilmBoxFilters = {
  ...EMPTY_FILM_BOX_FILTERS,
}

/** Genre category vocabulary (FM_filme.genre numeric codes). */
export const FILM_GENRES: { value: '1' | '2' | '3'; label: string }[] = [
  { value: '1', label: 'Fiction' },
  { value: '2', label: 'Documentary' },
  { value: '3', label: 'Hybrid' },
]
