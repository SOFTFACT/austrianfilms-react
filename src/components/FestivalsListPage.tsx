import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import { VirtualList } from './virtual'
import { useFestivalsInfinite } from '../hooks/useFestivals'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate } from '../lib/format'
import { Flag } from './Flag'
import { festivalRatingLabel, type Festival, type FestivalFilters } from '../types/festival'

export function FestivalsListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const apiFilters: FestivalFilters = {
    search: debouncedSearch || undefined,
    sortField: 'jahr',
    sortOrder: 'desc',
  }

  const { items, total, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useFestivalsInfinite(apiFilters)

  return (
    <div className="flex flex-col">
      <div className="sticky top-12 z-10 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur md:top-0 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">Festivals</h1>
          <span className="text-sm text-slate-500">{total.toLocaleString()} total</span>
          <div className="ml-auto relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search festival, city, country…"
              className="w-56 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-900 md:w-72"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 md:px-6">
        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {(error as { title?: string })?.title ?? 'Failed to load festivals.'}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No festivals found.</div>
        ) : (
          <div>
            {/* Column order mirrors /hq/festivals: Flag · City · Festival · Year · From · To · Rating. */}
            <div className="flex items-center gap-3 border-b border-slate-200 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span className="w-16 shrink-0">Country</span>
              <span className="hidden w-40 shrink-0 md:block">City</span>
              <span className="min-w-0 flex-1">Festival</span>
              <span className="w-14 shrink-0 text-right">Year</span>
              <span className="hidden w-24 shrink-0 text-right lg:block">From</span>
              <span className="hidden w-24 shrink-0 text-right lg:block">To</span>
              <span className="hidden w-20 shrink-0 xl:block">Rating</span>
            </div>
            <VirtualList<Festival>
              items={items}
              estimateSize={64}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              getItemKey={(f) => f.id}
              renderItem={(f) => (
                <button
                  onClick={() => navigate(`/festivals/${f.id}`)}
                  className="flex h-16 w-full items-center gap-3 border-b border-slate-100 bg-white px-3 text-left hover:bg-slate-50"
                >
                  <div className="flex w-16 shrink-0 items-center gap-1.5">
                    <Flag code={f.countryCode} />
                    <span className="text-xs uppercase text-slate-400">{f.countryCode}</span>
                  </div>
                  <div className="hidden w-40 shrink-0 truncate text-sm text-slate-500 md:block">{f.ort}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{f.festival || '—'}</div>
                    <div className="truncate text-xs text-slate-500 md:hidden">
                      {[f.ort, f.land || f.countryCode].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <div className="w-14 shrink-0 text-right text-sm text-slate-500">{f.jahr || ''}</div>
                  <div className="hidden w-24 shrink-0 text-right text-xs text-slate-400 lg:block">{formatDate(f.von)}</div>
                  <div className="hidden w-24 shrink-0 text-right text-xs text-slate-400 lg:block">{formatDate(f.bis)}</div>
                  <div className="hidden w-20 shrink-0 text-sm xl:block">
                    {f.rating ? (
                      <span className="text-amber-500" title={festivalRatingLabel(f.rating)}>
                        {'★'.repeat(Math.min(f.rating, 5))}
                      </span>
                    ) : null}
                  </div>
                </button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  )
}
