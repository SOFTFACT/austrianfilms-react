import { apiClient } from './client'
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
  return `?${p.toString()}`
}

export function getFilms(filters: FilmFilters = {}): Promise<Paginated<Film>> {
  return apiClient.get<Paginated<Film>>(`/fmfilms${toQuery(filters)}`)
}

// Single resource: bare entity (no data wrapper). `id` = UUID.
export function getFilm(id: string): Promise<Film> {
  return apiClient.get<Film>(`/fmfilms/${id}`)
}
