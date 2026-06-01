import { useState } from 'react'
import { Search, Filter, X, Loader2 } from 'lucide-react'
import { VirtualList } from './virtual'
import { useItinerariesInfinite } from '../hooks/useItineraries'
import { useItineraryFilters } from '../hooks/useItineraryFilters'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate } from '../lib/format'
import { Flag } from './Flag'
import {
  ITINERARY_STATUSES,
  itineraryStatusClasses,
  type Itinerary,
  type ItineraryFilters,
} from '../types/itinerary'

export function ItinerariesListPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [showFilters, setShowFilters] = useState(false)
  const { filters, update, clear, activeCount } = useItineraryFilters()

  const apiFilters: ItineraryFilters = {
    search: debouncedSearch || undefined,
    sortField: 'datum',
    sortOrder: 'desc',
    status: filters.status || undefined,
    country: filters.country || undefined,
    dateField: filters.dateField || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    premiereIntl: filters.premiereIntl || undefined,
    premiereLocal: filters.premiereLocal || undefined,
  }

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useItinerariesInfinite(apiFilters)

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Itineraries</h1>
          <span className="text-sm text-slate-500">{total.toLocaleString()} total</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search film, festival…"
                className="w-44 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-900 md:w-60"
              />
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="relative flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="ml-1 rounded-full bg-slate-900 px-1.5 text-xs text-white">{activeCount}</span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
            <select value={filters.status} onChange={(e) => update('status', e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">All statuses</option>
              {ITINERARY_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input value={filters.country} onChange={(e) => update('country', e.target.value)} placeholder="Country code" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <select value={filters.dateField} onChange={(e) => update('dateField', e.target.value as typeof filters.dateField)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Date field…</option>
              <option value="von">Festival from</option>
              <option value="bis">Festival to</option>
              <option value="deadline">Submission deadline</option>
            </select>
            <input type="date" value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <input type="date" value={filters.dateTo} onChange={(e) => update('dateTo', e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={filters.premiereIntl} onChange={(e) => update('premiereIntl', e.target.checked)} /> Intl
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={filters.premiereLocal} onChange={(e) => update('premiereLocal', e.target.checked)} /> Local
              </label>
            </div>
            {activeCount > 0 && (
              <button onClick={clear} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-3 md:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as { title?: string })?.title ?? 'Failed to load itineraries.'}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No itineraries found.</div>
        ) : (
          <VirtualList<Itinerary>
            items={items}
            estimateSize={64}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            getItemKey={(i) => i.id}
            renderItem={(i) => (
              <div className="flex h-16 w-full items-center gap-4 border-b border-slate-100 bg-white px-3">
                <div className="w-24 shrink-0">
                  {i.statusExtern ? (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${itineraryStatusClasses(i.statusExtern)}`}>
                      {i.statusExtern}
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{i.film || '—'}</div>
                  <div className="truncate text-xs text-slate-500">{i.festivalname}</div>
                </div>
                <div className="hidden w-44 shrink-0 text-right text-xs text-slate-400 md:block">
                  {formatDate(i.von)}{i.bis ? ` – ${formatDate(i.bis)}` : ''}
                </div>
                <div className="hidden w-20 shrink-0 items-center justify-end gap-1.5 text-right text-xs text-slate-400 lg:flex">
                  <Flag code={i.countryCode} />
                  <span className="truncate">{i.land || i.countryCode}</span>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  )
}
