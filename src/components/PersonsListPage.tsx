import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, LayoutGrid, List as ListIcon, UserRound } from 'lucide-react'
import { VirtualList, VirtualGrid } from './virtual'
import { usePersonsInfinite } from '../hooks/usePersons'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../lib/utils'
import type { Person, PersonFilters } from '../types/person'

type ViewMode = 'cards' | 'list'

function Avatar({ p, size }: { p: Person; size: string }) {
  if (p.imageUrl) {
    return <img src={p.imageUrl} alt={p.fullName} loading="lazy" className={`${size} rounded-full object-cover`} />
  }
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-slate-100 text-slate-400`}>
      <UserRound className="h-1/2 w-1/2" />
    </div>
  )
}

function PersonCard({ p, onClick }: { p: Person; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-full w-full flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-center transition-shadow hover:shadow-md"
    >
      <Avatar p={p} size="h-20 w-20" />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-slate-900">{p.fullName || '—'}</div>
        <div className="truncate text-xs text-slate-500">{p.kategorie}</div>
      </div>
    </button>
  )
}

export function PersonsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [category, setCategory] = useState('')
  const debouncedCategory = useDebounce(category, 300)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')

  const apiFilters: PersonFilters = {
    search: debouncedSearch || undefined,
    category: debouncedCategory || undefined,
    sortField: 'nachname',
    sortOrder: 'asc',
  }

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    usePersonsInfinite(apiFilters)

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Persons</h1>
          <span className="text-sm text-slate-500">{total.toLocaleString()} total</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-1 py-1" aria-label="View">
              <button type="button" onClick={() => setViewMode('cards')} title="Card view" aria-pressed={viewMode === 'cards'} className={cn('rounded p-1.5', viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100')}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setViewMode('list')} title="List view" aria-pressed={viewMode === 'list'} className={cn('rounded p-1.5', viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100')}>
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-900 md:w-36"
            />
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name…"
                className="w-40 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-900 md:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 md:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as { title?: string })?.title ?? 'Failed to load persons.'}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No persons found.</div>
        ) : viewMode === 'cards' ? (
          <VirtualGrid<Person>
            items={items}
            estimateRowSize={180}
            cardMinWidth={150}
            cardGap={16}
            rowClassName="pb-4"
            getItemKey={(p) => p.id}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            renderItem={(p) => <PersonCard p={p} onClick={() => navigate(`/persons/${p.id}`)} />}
          />
        ) : (
          <VirtualList<Person>
            items={items}
            estimateSize={64}
            getItemKey={(p) => p.id}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            renderItem={(p) => (
              <button
                onClick={() => navigate(`/persons/${p.id}`)}
                className="flex h-16 w-full items-center gap-3 border-b border-slate-100 bg-white px-3 text-left hover:bg-slate-50"
              >
                <Avatar p={p} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-900">{p.fullName || '—'}</div>
                  <div className="truncate text-xs text-slate-500">{p.kategorie}</div>
                </div>
                <div className="hidden w-32 shrink-0 truncate text-right text-xs text-slate-400 md:block">{p.born_in}</div>
              </button>
            )}
          />
        )}
      </div>
    </div>
  )
}
