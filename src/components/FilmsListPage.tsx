import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Loader2, LayoutGrid, List as ListIcon, Plus, ChevronRight } from 'lucide-react'
import { VirtualList, VirtualGrid } from './virtual'
import { useFilmsInfinite } from '../hooks/useFilms'
import { useFilmFilters } from '../hooks/useFilmFilters'
import { useDebounce } from '../hooks/useDebounce'
import { useExpandableRows } from '../hooks/useExpandableRows'
import { fetchAllPages } from '../lib/fetchAllPages'
import { type ExportColumn } from '../lib/exportTable'
import { getFilms } from '../api/films'
import { cn } from '../lib/utils'
import { ExportMenu } from './ExportMenu'
import { FilmFilterPanel } from './FilmFilterPanel'
import { FilmFormModal } from './FilmFormModal'
import { RowInlineDetail, ExpandAllButton, type DetailField } from './RowInlineDetail'
import { SortHeader, nextSort, type SortState } from './SortHeader'
import type { Film, FilmFilters } from '../types/film'

type ViewMode = 'cards' | 'list'

/** Expanded row-detail fields — mirrors the /hq/films tabulator row-detail. */
function filmDetailFields(f: Film): DetailField[] {
  return [
    { label: 'Title', value: f.titel },
    { label: 'English title', value: f.englischerTitel },
    { label: 'Year', value: f.produktionsjahr || '' },
    { label: 'Director', value: f.regie },
    { label: 'Production', value: f.produktion },
    { label: 'Category', value: f.kategorie },
    { label: 'Genre', value: f.filmgenre || f.genreText },
    { label: 'Contact', value: f.betreuung },
    { label: 'Source', value: f.sourceJART ? 'JART' : '' },
    { label: 'ID', value: <span className="font-mono text-xs text-slate-400">{f.id}</span> },
  ]
}

/** CSV export columns — mirrors the /hq/films table. */
const EXPORT_COLUMNS: ExportColumn<Film>[] = [
  { header: 'Title', value: (f) => f.titel },
  { header: 'English title', value: (f) => f.englischerTitel },
  { header: 'Year', value: (f) => f.produktionsjahr || '' },
  { header: 'Director', value: (f) => f.regie },
  { header: 'Production', value: (f) => f.produktion },
  { header: 'Genre', value: (f) => f.filmgenre },
  { header: 'Contact', value: (f) => f.betreuung },
]

function FilmCard({ f, onClick }: { f: Film; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-shadow hover:shadow-md"
    >
      {f.imageUrl ? (
        <img src={f.imageUrl} alt={f.titel} loading="lazy" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
          No image
        </div>
      )}
      <div className="min-w-0 p-2">
        <div className="truncate text-sm font-medium text-slate-900">{f.titel || '—'}</div>
        <div className="truncate text-xs text-slate-500">
          {[f.produktionsjahr || '', f.filmgenre].filter(Boolean).join(' · ')}
        </div>
      </div>
    </button>
  )
}

export function FilmsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [showFilters, setShowFilters] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sort, setSort] = useState<SortState>({ field: 'produktionsjahr', order: 'desc' })
  const { filters, update, clear, activeCount } = useFilmFilters()
  const { isExpanded, toggle, expandAll, collapseAll } = useExpandableRows()

  const toggleSort = (field: string) => setSort((s) => nextSort(s, field))

  const apiFilters: FilmFilters = {
    search: debouncedSearch || undefined,
    sortField: sort.field,
    sortOrder: sort.order,
    genre: filters.genre || undefined,
    director: filters.director || undefined,
    filmgenre: filters.filmgenre || undefined,
    production: filters.production || undefined,
    yearFrom: filters.yearFrom || undefined,
    yearTo: filters.yearTo || undefined,
    actualOnly: filters.actualOnly === 'true' || undefined,
  }

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useFilmsInfinite(apiFilters)

  const allExpanded = items.length > 0 && items.every((f) => isExpanded(f.id))
  const toggleAll = () => (allExpanded ? collapseAll() : expandAll(items.map((f) => f.id)))

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Films</h1>
          <span className="text-sm text-slate-500">{total.toLocaleString()} total</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New film
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-1 py-1" aria-label="View">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Card view"
                aria-pressed={viewMode === 'cards'}
                className={cn('rounded p-1.5', viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List view"
                aria-pressed={viewMode === 'list'}
                className={cn('rounded p-1.5', viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100')}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title…"
                className="w-40 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-900 md:w-56"
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
            {viewMode === 'list' && <ExpandAllButton allExpanded={allExpanded} onToggle={toggleAll} />}
            <ExportMenu<Film>
              filenameBase="films"
              columns={EXPORT_COLUMNS}
              loadRows={(onProgress) =>
                fetchAllPages<Film>(
                  (offset, limit) => getFilms({ ...apiFilters, offset, limit }),
                  { onProgress: (n) => onProgress(n) },
                ).then(({ rows, truncated }) => ({ rows, truncated }))
              }
            />
          </div>
        </div>

        {showFilters && (
          <FilmFilterPanel
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
            {(error as { title?: string })?.title ?? 'Failed to load films.'}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No films found.</div>
        ) : viewMode === 'cards' ? (
          <VirtualGrid<Film>
            items={items}
            estimateRowSize={224}
            cardMinWidth={240}
            cardGap={16}
            rowClassName="pb-4"
            getItemKey={(f) => f.id}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            renderItem={(f) => <FilmCard f={f} onClick={() => navigate(`/films/${f.id}`)} />}
          />
        ) : (
          <div>
            {/* Column header — mirrors /hq/films (Title · Year · Director · Production · Genre · Contact). */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-3 pb-2 text-xs font-semibold tracking-wide text-slate-400">
              <span className="w-16 shrink-0" />
              <SortHeader label="Title" field="titel" sort={sort} onSort={toggleSort} className="min-w-0 flex-1" />
              <SortHeader label="Year" field="produktionsjahr" sort={sort} onSort={toggleSort} className="w-14 shrink-0 justify-end" />
              {/* Director is relational/multi-valued (person_film_rel) — not server-sortable, so it's a static header like /hq/films. */}
              <span className="hidden w-36 shrink-0 items-center uppercase md:flex">Director</span>
              <SortHeader label="Production" field="produktion" sort={sort} onSort={toggleSort} className="hidden w-44 shrink-0 lg:flex" />
              <SortHeader label="Genre" field="filmgenre" sort={sort} onSort={toggleSort} className="hidden w-28 shrink-0 xl:flex" />
              <SortHeader label="Contact" field="betreuung" sort={sort} onSort={toggleSort} className="hidden w-28 shrink-0 2xl:flex" />
              <span className="w-5 shrink-0" />
            </div>
            <VirtualList<Film>
              items={items}
              estimateSize={64}
              variableHeight
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              getItemKey={(f) => f.id}
              renderItem={(f) => {
                const exp = isExpanded(f.id)
                return (
                  <div>
                    <div
                      role="row"
                      onClick={() => toggle(f.id)}
                      aria-expanded={exp}
                      className={cn(
                        'flex h-16 w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-3 text-left hover:bg-slate-50',
                        exp ? 'bg-slate-50' : 'bg-white',
                      )}
                    >
                      {f.imageUrl ? (
                        <img src={f.imageUrl} alt="" loading="lazy" className="h-9 w-16 shrink-0 rounded object-cover" />
                      ) : (
                        <div className="h-9 w-16 shrink-0 rounded bg-slate-100" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-900">{f.titel || '—'}</div>
                        {f.englischerTitel && <div className="truncate text-xs text-slate-500">{f.englischerTitel}</div>}
                      </div>
                      <div className="w-14 shrink-0 text-right text-sm text-slate-500">{f.produktionsjahr || ''}</div>
                      <div className="hidden w-36 shrink-0 truncate text-sm text-slate-500 md:block">{f.regie}</div>
                      <div className="hidden w-44 shrink-0 truncate text-xs text-slate-500 lg:block">{f.produktion}</div>
                      <div className="hidden w-28 shrink-0 truncate text-xs text-slate-500 xl:block">{f.filmgenre}</div>
                      <div className="hidden w-28 shrink-0 truncate text-xs text-slate-400 2xl:block">{f.betreuung}</div>
                      <ChevronRight className={cn('h-4 w-4 shrink-0 text-slate-300 transition-transform', exp && 'rotate-90')} />
                    </div>
                    {exp && (
                      <RowInlineDetail
                        imageUrl={f.imageUrl || undefined}
                        imageAlt={f.titel}
                        fields={filmDetailFields(f)}
                        actions={
                          <button
                            type="button"
                            onClick={() => navigate(`/films/${f.id}`)}
                            className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                          >
                            Open film
                          </button>
                        }
                        onClose={() => toggle(f.id)}
                      />
                    )}
                  </div>
                )
              }}
            />
          </div>
        )}
      </div>

      {showCreate && <FilmFormModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
