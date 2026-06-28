import { apiFetch } from '@/lib/api4d'
import type { Film, FilmFilters, Paginated } from '../types/film'

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
 * NOTE: `regie` maps to FM_filme.X_regie. List/detail show the director from
 * person_film_rel (computed), so an edited `regie` saves but won't surface in
 * those views — same behaviour as the legacy /hq film modal. Proper director
 * management is a PATCH {director} concern (creates person_film_rel).
 */
export interface FilmWriteBody {
  titel: string
  produktionsjahr: number
  englischerTitel?: string
  genre?: number
  regie?: string
  produktion?: string
  kategorie?: string
  filmgenre?: string
  betreuung?: string
  minuten?: string
  format?: string
  originalsprache?: string
  weltvertrieb?: string
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
