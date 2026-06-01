/**
 * Festival -- output shape of cs.FestivalsController (GET /api/v1/festivals[/:id]).
 * DB-faithful German attribute names; `id` is the UUID (primarschlussel).
 */
export interface Festival {
  id: string
  festival: string
  jahr: number
  ort: string
  land: string
  countryCode: string
  von: string
  bis: string
  firma?: string
  firmaEngl?: string
  emailMain?: string
  websiteMain?: string
  editionNr?: number
  rating?: number
  earlyDeadline?: string
  regularDeadline?: string
  finalDeadline?: string
  bemerkung?: string
}

/**
 * Festival query params. The list endpoint only allows limit/offset/sort;
 * full-text `search` is routed to /festivals:search by the api module.
 */
export interface FestivalFilters {
  search?: string
  limit?: number
  offset?: number
  page?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

/** Festival rating code -> label (1=Key, 2/4/8 tiers, 16=Other). */
export function festivalRatingLabel(rating: number | undefined): string {
  switch (rating) {
    case 1:
      return 'Key'
    case 2:
      return '1st tier'
    case 4:
      return '2nd tier'
    case 8:
      return '3rd tier'
    case 16:
      return 'Other'
    default:
      return ''
  }
}
