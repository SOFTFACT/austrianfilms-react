import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, X, Loader2, LayoutGrid, List as ListIcon } from 'lucide-react'
import { VirtualList, VirtualGrid } from './virtual'
import { useFilmsInfinite } from '../hooks/useFilms'
import { useFilmFilters } from '../hooks/useFilmFilters'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../lib/utils'
import type { Film, FilmFilters } from '../types/film'

type ViewMode = 'cards' | 'list'

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const { filters, update, clear, activeCount } = useFilmFilters()

  const apiFilters: FilmFilters = {
    search: debouncedSearch || undefined,
    filmgenre: filters.filmgenre || undefined,
    production: filters.production || undefined,
    yearFrom: filters.yearFrom || undefined,
    yearTo: filters.yearTo || undefined,
    actualOnly: filters.actualOnly === 'true' || undefined,
  }

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useFilmsInfinite(apiFilters)

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Films</h1>
          <span className="text-sm text-slate-500">{total.toLocaleString()} total</span>
          <div className="ml-auto flex items-center gap-2">
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
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 grid grid-cols-2 items-center gap-2 md:grid-cols-5">
            <input value={filters.filmgenre} onChange={(e) => update('filmgenre', e.target.value)} placeholder="Genre" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <input value={filters.production} onChange={(e) => update('production', e.target.value)} placeholder="Production" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <input value={filters.yearFrom} onChange={(e) => update('yearFrom', e.target.value)} placeholder="Year from" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <input value={filters.yearTo} onChange={(e) => update('yearTo', e.target.value)} placeholder="Year to" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={filters.actualOnly === 'true'} onChange={(e) => update('actualOnly', e.target.checked ? 'true' : '')} />
              Current only
            </label>
            {activeCount > 0 && (
              <button onClick={clear} className="col-span-2 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 md:col-span-1">
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
          <VirtualList<Film>
            items={items}
            estimateSize={64}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            getItemKey={(f) => f.id}
            renderItem={(f) => (
              <button
                onClick={() => navigate(`/films/${f.id}`)}
                className="flex h-16 w-full items-center gap-4 border-b border-slate-100 bg-white px-3 text-left hover:bg-slate-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{f.titel || '—'}</div>
                  {f.englischerTitel && <div className="truncate text-xs text-slate-500">{f.englischerTitel}</div>}
                </div>
                <div className="w-16 shrink-0 text-right text-sm text-slate-500">{f.produktionsjahr || ''}</div>
                <div className="hidden w-28 shrink-0 truncate text-xs text-slate-500 md:block">{f.filmgenre}</div>
                <div className="hidden w-40 shrink-0 truncate text-sm text-slate-500 lg:block">{f.regie}</div>
                <div className="hidden w-40 shrink-0 truncate text-xs text-slate-400 xl:block">{f.produktion}</div>
              </button>
            )}
          />
        )}
      </div>
    </div>
  )
}
