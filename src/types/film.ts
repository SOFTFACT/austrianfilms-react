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
  regie: string
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

/** Genre category vocabulary (FM_filme.genre numeric codes). */
export const FILM_GENRES: { value: '1' | '2' | '3'; label: string }[] = [
  { value: '1', label: 'Fiction' },
  { value: '2', label: 'Documentary' },
  { value: '3', label: 'Hybrid' },
]
