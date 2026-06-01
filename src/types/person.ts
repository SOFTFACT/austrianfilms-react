/**
 * Person -- output shape of cs.PersonenController.personToObject
 * (GET /api/v1/persons[/:id]). `id` is personen_id; image via /getimage.
 */
export interface Person {
  id: string
  vorname: string
  nachname: string
  fullName: string
  kategorie: string
  sex?: string
  born_in?: string
  born_inYear?: number
  died_in?: string
  died_inYear?: number
  website?: string
  imageUrl?: string
  hasImage?: boolean
}

/**
 * Person query params. The list endpoint allows limit/offset/sort + `category`;
 * full-text `search` routes to /persons:search (no category there).
 */
export interface PersonFilters {
  search?: string
  limit?: number
  offset?: number
  page?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  category?: string
}
