import { useState } from 'react'
import { Search, Filter, Loader2, Plus, ChevronRight } from 'lucide-react'
import { VirtualList } from './virtual'
import { useItinerariesInfinite } from '../hooks/useItineraries'
import { useItineraryFilters } from '../hooks/useItineraryFilters'
import { useDebounce } from '../hooks/useDebounce'
import { useExpandableRows } from '../hooks/useExpandableRows'
import { formatDate } from '../lib/format'
import { fetchAllPages } from '../lib/fetchAllPages'
import { type ExportColumn } from '../lib/exportTable'
import { getItineraries } from '../api/itineraries'
import { cn } from '../lib/utils'
import { Flag } from './Flag'
import { NewItineraryModal } from './NewItineraryModal'
import { ItineraryFilterPanel } from './ItineraryFilterPanel'
import { ExportMenu } from './ExportMenu'
import { RowInlineDetail, ExpandAllButton, type DetailField } from './RowInlineDetail'
import { SortHeader } from './SortHeader'
import { nextSort, type SortState } from '../lib/sort'
import {
  itineraryStatusClasses,
  type Itinerary,
  type ItineraryFilters,
} from '../types/itinerary'

/** Expanded row-detail fields — mirrors the /hq/itineraries tabulator row-detail. */
function itineraryDetailFields(i: Itinerary): DetailField[] {
  const dates = [formatDate(i.von), formatDate(i.bis)].filter(Boolean).join(' – ')
  const fields: DetailField[] = [
    { label: 'Festival', value: i.festivalname },
    { label: 'Film', value: i.film },
    { label: 'Country', value: i.land || i.countryCode },
    { label: 'City', value: i.city || i.ort },
    {
      label: 'Status',
      value: i.statusExtern ? (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${itineraryStatusClasses(i.statusExtern)}`}>
          {i.statusExtern}
        </span>
      ) : (
        ''
      ),
    },
    { label: 'Section', value: i.sektion },
    { label: 'Dates', value: dates },
    { label: 'Submission via', value: i.submissionVia },
    { label: 'Screening fee', value: i.screeningFee ? `€${i.screeningFee}` : '' },
    { label: 'Record date', value: i.datum ? formatDate(i.datum) : '' },
    { label: 'ID', value: <span className="font-mono text-xs text-muted-foreground">{i.id}</span> },
  ]
  if (i.notesPublic) fields.push({ label: 'Notes', value: i.notesPublic, full: true })
  return fields
}

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
  const { isExpanded, toggle, expandAll, collapseAll } = useExpandableRows()

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

  const allExpanded = items.length > 0 && items.every((i) => isExpanded(i.id))
  const toggleAll = () => (allExpanded ? collapseAll() : expandAll(items.map((i) => i.id)))

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-border bg-muted/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Itineraries</h1>
          <span className="text-sm text-muted-foreground">{total.toLocaleString()} total</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> New
            </button>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search film, festival…"
                className="w-44 rounded-lg border border-border bg-card py-2 pl-8 pr-3 text-sm outline-none focus:border-ring md:w-60"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              aria-haspopup="dialog"
              className="relative flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
              )}
            </button>
            <ExpandAllButton allExpanded={allExpanded} onToggle={toggleAll} />
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

        <ItineraryFilterPanel
          open={showFilters}
          onOpenChange={setShowFilters}
          filters={filters}
          update={update}
          clear={clear}
          activeCount={activeCount}
        />
      </div>

      <div className="px-4 py-3 md:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {(error as { title?: string })?.title ?? 'Failed to load itineraries.'}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No itineraries found.</div>
        ) : (
          <div>
            {/* Column order mirrors /hq/itineraries: Country · City · Festival · Film · From · To · Status · Section. */}
            <div className="flex items-center gap-3 border-b border-border px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground">
              <span className="w-16 shrink-0 uppercase">Country</span>
              <SortHeader label="City" field="city" sort={sort} onSort={toggleSort} className="hidden w-32 shrink-0 lg:flex" />
              <SortHeader label="Festival" field="festivalname" sort={sort} onSort={toggleSort} className="hidden w-40 shrink-0 xl:flex" />
              <SortHeader label="Film" field="film" sort={sort} onSort={toggleSort} className="min-w-0 flex-1" />
              <SortHeader label="From" field="von" sort={sort} onSort={toggleSort} className="hidden w-24 shrink-0 justify-end md:flex" />
              <SortHeader label="To" field="bis" sort={sort} onSort={toggleSort} className="hidden w-24 shrink-0 justify-end md:flex" />
              <SortHeader label="Status" field="statusExtern" sort={sort} onSort={toggleSort} className="w-28 shrink-0" />
              <SortHeader label="Section" field="sektion" sort={sort} onSort={toggleSort} className="hidden w-24 shrink-0 2xl:flex" />
              <span className="w-5 shrink-0" />
            </div>
            <VirtualList<Itinerary>
              items={items}
              estimateSize={64}
              variableHeight
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              getItemKey={(i) => i.id}
              renderItem={(i) => {
                const exp = isExpanded(i.id)
                return (
                  <div>
                    <div
                      role="row"
                      onClick={() => toggle(i.id)}
                      aria-expanded={exp}
                      className={cn(
                        'flex h-16 w-full cursor-pointer items-center gap-3 border-b border-border px-3 hover:bg-muted',
                        exp ? 'bg-muted' : 'bg-card',
                      )}
                    >
                      <div className="flex w-16 shrink-0 items-center gap-1.5">
                        <Flag code={i.countryCode} />
                        <span className="text-xs uppercase text-muted-foreground">{i.countryCode}</span>
                      </div>
                      <div className="hidden w-32 shrink-0 truncate text-sm text-muted-foreground lg:block">{i.city || i.ort}</div>
                      <div className="hidden w-40 shrink-0 truncate text-sm text-muted-foreground xl:block">{i.festivalname}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{i.film || '—'}</div>
                        <div className="truncate text-xs text-muted-foreground xl:hidden">
                          {[i.city || i.ort, i.festivalname].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <div className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground md:block">{formatDate(i.von)}</div>
                      <div className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground md:block">{formatDate(i.bis)}</div>
                      <div className="w-28 shrink-0">
                        {i.statusExtern ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${itineraryStatusClasses(i.statusExtern)}`}>
                            {i.statusExtern}
                          </span>
                        ) : null}
                      </div>
                      <div className="hidden w-24 shrink-0 truncate text-xs text-muted-foreground 2xl:block">{i.sektion}</div>
                      <ChevronRight className={cn('h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform', exp && 'rotate-90')} />
                    </div>
                    {exp && (
                      <RowInlineDetail fields={itineraryDetailFields(i)} onClose={() => toggle(i.id)} />
                    )}
                  </div>
                )
              }}
            />
          </div>
        )}
      </div>
      {showNew && <NewItineraryModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
