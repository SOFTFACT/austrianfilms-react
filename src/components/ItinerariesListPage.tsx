import { useState } from 'react'
import { Search, Filter, Loader2, Plus } from 'lucide-react'
import { VirtualList } from './virtual'
import { useItinerariesInfinite } from '../hooks/useItineraries'
import { useItineraryFilters } from '../hooks/useItineraryFilters'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate } from '../lib/format'
import { fetchAllPages } from '../lib/fetchAllPages'
import { type ExportColumn } from '../lib/exportTable'
import { getItineraries } from '../api/itineraries'
import { Flag } from './Flag'
import { NewItineraryModal } from './NewItineraryModal'
import { ItineraryFilterPanel } from './ItineraryFilterPanel'
import { ExportMenu } from './ExportMenu'
import { SortHeader, nextSort, type SortState } from './SortHeader'
import {
  itineraryStatusClasses,
  type Itinerary,
  type ItineraryFilters,
} from '../types/itinerary'

/** CSV export columns — mirrors the visible table plus a few useful extras. */
const EXPORT_COLUMNS: ExportColumn<Itinerary>[] = [
  { header: 'Country', value: (i) => i.countryCode || i.land },
  { header: 'City', value: (i) => i.city || i.ort },
  { header: 'Festival', value: (i) => i.festivalname },
  { header: 'Film', value: (i) => i.film },
  { header: 'From', value: (i) => formatDate(i.von) },
  { header: 'To', value: (i) => formatDate(i.bis) },
  { header: 'Status', value: (i) => i.statusExtern },
  { header: 'Section', value: (i) => i.sektion },
  { header: 'Submission via', value: (i) => i.submissionVia },
  { header: 'Premiere Intl', value: (i) => (i.premiereIntl ? 'yes' : '') },
  { header: 'Premiere Local', value: (i) => (i.premiereLocal ? 'yes' : '') },
]

export function ItinerariesListPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [showFilters, setShowFilters] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [sort, setSort] = useState<SortState>({ field: 'von', order: 'desc' })
  const toggleSort = (field: string) => setSort((s) => nextSort(s, field))
  const { filters, update, clear, activeCount } = useItineraryFilters()

  const apiFilters: ItineraryFilters = {
    search: debouncedSearch || undefined,
    sortField: sort.field,
    sortOrder: sort.order,
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
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" /> New
            </button>
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
            <ExportMenu<Itinerary>
              filenameBase="itineraries"
              columns={EXPORT_COLUMNS}
              loadRows={(onProgress) =>
                fetchAllPages<Itinerary>(
                  (offset, limit) => getItineraries({ ...apiFilters, offset, limit }),
                  { onProgress: (n) => onProgress(n) },
                ).then(({ rows, truncated }) => ({ rows, truncated }))
              }
            />
          </div>
        </div>

        {showFilters && (
          <ItineraryFilterPanel
            filters={filters}
            update={update}
            clear={clear}
            activeCount={activeCount}
            onClose={() => setShowFilters(false)}
          />
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
          <div>
            {/* Column order mirrors /hq/itineraries: Country · City · Festival · Film · From · To · Status · Section. */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-3 pb-2 text-xs font-semibold tracking-wide text-slate-400">
              <span className="w-16 shrink-0 uppercase">Country</span>
              <SortHeader label="City" field="city" sort={sort} onSort={toggleSort} className="hidden w-32 shrink-0 lg:flex" />
              <SortHeader label="Festival" field="festivalname" sort={sort} onSort={toggleSort} className="hidden w-40 shrink-0 xl:flex" />
              <SortHeader label="Film" field="film" sort={sort} onSort={toggleSort} className="min-w-0 flex-1" />
              <SortHeader label="From" field="von" sort={sort} onSort={toggleSort} className="hidden w-24 shrink-0 justify-end md:flex" />
              <SortHeader label="To" field="bis" sort={sort} onSort={toggleSort} className="hidden w-24 shrink-0 justify-end md:flex" />
              <SortHeader label="Status" field="statusExtern" sort={sort} onSort={toggleSort} className="w-28 shrink-0" />
              <SortHeader label="Section" field="sektion" sort={sort} onSort={toggleSort} className="hidden w-24 shrink-0 2xl:flex" />
            </div>
            <VirtualList<Itinerary>
              items={items}
              estimateSize={64}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              getItemKey={(i) => i.id}
              renderItem={(i) => (
                <div className="flex h-16 w-full items-center gap-3 border-b border-slate-100 bg-white px-3">
                  <div className="flex w-16 shrink-0 items-center gap-1.5">
                    <Flag code={i.countryCode} />
                    <span className="text-xs uppercase text-slate-400">{i.countryCode}</span>
                  </div>
                  <div className="hidden w-32 shrink-0 truncate text-sm text-slate-500 lg:block">{i.city || i.ort}</div>
                  <div className="hidden w-40 shrink-0 truncate text-sm text-slate-500 xl:block">{i.festivalname}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{i.film || '—'}</div>
                    <div className="truncate text-xs text-slate-500 xl:hidden">
                      {[i.city || i.ort, i.festivalname].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div className="hidden w-24 shrink-0 text-right text-xs text-slate-400 md:block">{formatDate(i.von)}</div>
                  <div className="hidden w-24 shrink-0 text-right text-xs text-slate-400 md:block">{formatDate(i.bis)}</div>
                  <div className="w-28 shrink-0">
                    {i.statusExtern ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${itineraryStatusClasses(i.statusExtern)}`}>
                        {i.statusExtern}
                      </span>
                    ) : null}
                  </div>
                  <div className="hidden w-24 shrink-0 truncate text-xs text-slate-400 2xl:block">{i.sektion}</div>
                </div>
              )}
            />
          </div>
        )}
      </div>
      {showNew && <NewItineraryModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
