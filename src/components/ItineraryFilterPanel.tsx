import { X } from 'lucide-react'
import {
  ITINERARY_STATUSES,
  itineraryStatusClasses,
  type ItineraryBoxFilters,
} from '../types/itinerary'

interface ItineraryFilterPanelProps {
  filters: ItineraryBoxFilters
  update: <K extends keyof ItineraryBoxFilters>(key: K, value: ItineraryBoxFilters[K]) => void
  clear: () => void
  activeCount: number
  onClose: () => void
}

/**
 * Desktop slide-down filter panel for the itineraries list (artdimensions
 * AdvancedFilterPanel pattern): a card rendered under the toolbar, collapsing
 * away when closed so the table stays full-width. Status is a multi-select chip
 * group — the backend's `status` param is comma-separated (statusExtern IN ...),
 * so selected statuses are stored as a CSV string in `filters.status`.
 */
export function ItineraryFilterPanel({
  filters,
  update,
  clear,
  activeCount,
  onClose,
}: ItineraryFilterPanelProps) {
  // status is held as a CSV string so the API layer can forward it verbatim.
  const selectedStatuses = filters.status ? filters.status.split(',') : []
  const toggleStatus = (status: string) => {
    const set = new Set(selectedStatuses)
    if (set.has(status)) {
      set.delete(status)
    } else {
      set.add(status)
    }
    update('status', [...set].join(','))
  }

  const field =
    'rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-slate-900'

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={clear} className="text-sm text-slate-500 hover:text-slate-900">
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3">
        {/* Status — multi-select chips, colored per status when active. */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Status
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ITINERARY_STATUSES.map((status) => {
              const active = selectedStatuses.includes(status)
              return (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  aria-pressed={active}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? `${itineraryStatusClasses(status)} ring-2 ring-inset ring-slate-900/25`
                      : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {status}
                </button>
              )
            })}
          </div>
        </div>

        {/* Country + date range + premiere flags. */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Country
            </label>
            <input
              value={filters.country}
              onChange={(e) => update('country', e.target.value)}
              placeholder="e.g. AT, DE, US"
              className={`${field} w-28`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Date range
            </label>
            <div className="flex items-center gap-2">
              <select
                value={filters.dateField}
                onChange={(e) => update('dateField', e.target.value as typeof filters.dateField)}
                className={field}
              >
                <option value="">Field…</option>
                <option value="von">Festival from</option>
                <option value="bis">Festival to</option>
                <option value="deadline">Submission deadline</option>
              </select>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => update('dateFrom', e.target.value)}
                className={field}
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => update('dateTo', e.target.value)}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Premiere
            </label>
            <div className="flex items-center gap-3 py-1.5 text-sm text-slate-700">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={filters.premiereIntl}
                  onChange={(e) => update('premiereIntl', e.target.checked)}
                />
                Intl
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={filters.premiereLocal}
                  onChange={(e) => update('premiereLocal', e.target.checked)}
                />
                Local
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
