/**
 * Itinerary -- output shape of cs.ItineraryController (GET /api/v1/itineraries).
 * Film/festival names are denormalized (X_film/X_festivalname legacy) and
 * surfaced as `film` / `festivalname`. `id` is the UUID.
 */
export interface Itinerary {
  id: string
  film: string
  festivalname: string
  statusExtern: string
  land: string
  city?: string
  ort?: string
  von: string
  bis: string
  datum?: string
  sektion?: string
  submissionVia?: string
  screeningFee?: string
  notesPublic?: string
  notesInternal?: string
  premiereIntl?: boolean
  premiereLocal?: boolean
  countryCode?: string
}

/**
 * Itinerary query params. The list endpoint allows limit/offset/sort PLUS
 * filters (status/country/dateField/dateFrom/dateTo/premiereIntl/premiereLocal);
 * full-text `search` routes to :search (filters not supported there).
 */
export interface ItineraryFilters {
  search?: string
  limit?: number
  offset?: number
  page?: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  status?: string
  country?: string
  dateField?: 'von' | 'bis' | 'deadline'
  dateFrom?: string
  dateTo?: string
  premiereIntl?: boolean
  premiereLocal?: boolean
}

/** Filter-panel state (drawer). */
export interface ItineraryBoxFilters {
  status: string
  country: string
  dateField: '' | 'von' | 'bis' | 'deadline'
  dateFrom: string
  dateTo: string
  premiereIntl: boolean
  premiereLocal: boolean
}

export const ITINERARY_STATUSES = [
  'Submitted',
  'Confirmed',
  'Rejected',
  'Invited',
  'Accepted',
  'Proposed',
  'Not Selected',
  'Withdrawn',
  'Cancelled',
]

export const EMPTY_ITINERARY_BOX_FILTERS: ItineraryBoxFilters = {
  status: '',
  country: '',
  dateField: '',
  dateFrom: '',
  dateTo: '',
  premiereIntl: false,
  premiereLocal: false,
}

/** Status -> Tailwind badge classes. */
export function itineraryStatusClasses(status: string): string {
  switch (status) {
    case 'Confirmed':
    case 'Accepted':
      return 'bg-emerald-100 text-emerald-700'
    case 'Invited':
    case 'Submitted':
    case 'Proposed':
      return 'bg-blue-100 text-blue-700'
    case 'Rejected':
    case 'Not Selected':
      return 'bg-rose-100 text-rose-700'
    case 'Withdrawn':
    case 'Cancelled':
      return 'bg-slate-200 text-slate-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}
