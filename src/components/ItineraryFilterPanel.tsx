import {
  ITINERARY_STATUSES,
  itineraryStatusClasses,
  type ItineraryBoxFilters,
} from '../types/itinerary'
import { FilterChip, FilterField, FilterSheet, filterInputCls } from './FilterSheet'

interface ItineraryFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ItineraryBoxFilters
  update: <K extends keyof ItineraryBoxFilters>(key: K, value: ItineraryBoxFilters[K]) => void
  clear: () => void
  activeCount: number
}

/**
 * Filter drawer for the itineraries list. Status is a multi-select chip group —
 * the backend's `status` param is comma-separated (statusExtern IN ...), so the
 * selected statuses are stored as a CSV string in `filters.status`.
 */
export function ItineraryFilterPanel({
  open,
  onOpenChange,
  filters,
  update,
  clear,
  activeCount,
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

  return (
    <FilterSheet open={open} onOpenChange={onOpenChange} activeCount={activeCount} clear={clear}>
      <FilterField label="Status">
        <div className="flex flex-wrap gap-1.5">
          {ITINERARY_STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={selectedStatuses.includes(status)}
              onClick={() => toggleStatus(status)}
              activeClassName={`${itineraryStatusClasses(status)} ring-2 ring-inset ring-ring/25`}
            >
              {status}
            </FilterChip>
          ))}
        </div>
      </FilterField>

      <FilterField label="Country">
        <input
          value={filters.country}
          onChange={(e) => update('country', e.target.value)}
          placeholder="e.g. AT, DE, US"
          className={filterInputCls}
        />
      </FilterField>

      <FilterField label="Date range">
        <div className="space-y-2">
          <select
            value={filters.dateField}
            onChange={(e) => update('dateField', e.target.value as typeof filters.dateField)}
            className={filterInputCls}
          >
            <option value="">Field…</option>
            <option value="von">Festival from</option>
            <option value="bis">Festival to</option>
            <option value="deadline">Submission deadline</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => update('dateFrom', e.target.value)}
              className={filterInputCls}
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => update('dateTo', e.target.value)}
              className={filterInputCls}
            />
          </div>
        </div>
      </FilterField>

      <FilterField label="Premiere">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
      </FilterField>
    </FilterSheet>
  )
}
