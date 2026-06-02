import { X } from 'lucide-react'
import { FILM_GENRES, type FilmBoxFilters } from '../types/film'

interface FilmFilterPanelProps {
  filters: FilmBoxFilters
  update: <K extends keyof FilmBoxFilters>(key: K, value: FilmBoxFilters[K]) => void
  clear: () => void
  activeCount: number
  onClose: () => void
}

/**
 * Desktop slide-down filter panel for the films list (same pattern as
 * ItineraryFilterPanel). Genre is a single-select chip group — FM_filme.genre
 * is one numeric category per film (1 Fiction / 2 Documentary / 3 Hybrid).
 */
export function FilmFilterPanel({ filters, update, clear, activeCount, onClose }: FilmFilterPanelProps) {
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
        {/* Genre category — single-select chips. */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
            Genre
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FILM_GENRES.map((g) => {
              const active = filters.genre === g.value
              return (
                <button
                  key={g.value}
                  onClick={() => update('genre', active ? '' : g.value)}
                  aria-pressed={active}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? 'bg-slate-900 text-white ring-2 ring-inset ring-slate-900/25'
                      : 'bg-white text-slate-500 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {g.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Director + sub-genre + production + year + current-only. */}
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Director
            </label>
            <input
              value={filters.director}
              onChange={(e) => update('director', e.target.value)}
              placeholder="Name…"
              className={`${field} w-40`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sub-genre
            </label>
            <input
              value={filters.filmgenre}
              onChange={(e) => update('filmgenre', e.target.value)}
              placeholder="e.g. Long Documentary"
              className={`${field} w-44`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Production
            </label>
            <input
              value={filters.production}
              onChange={(e) => update('production', e.target.value)}
              placeholder="Company…"
              className={`${field} w-40`}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Year
            </label>
            <div className="flex items-center gap-2">
              <input
                value={filters.yearFrom}
                onChange={(e) => update('yearFrom', e.target.value)}
                placeholder="from"
                inputMode="numeric"
                className={`${field} w-20`}
              />
              <span className="text-slate-400">–</span>
              <input
                value={filters.yearTo}
                onChange={(e) => update('yearTo', e.target.value)}
                placeholder="to"
                inputMode="numeric"
                className={`${field} w-20`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 py-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={filters.actualOnly === 'true'}
              onChange={(e) => update('actualOnly', e.target.checked ? 'true' : '')}
            />
            Current only
          </label>
        </div>
      </div>
    </div>
  )
}
