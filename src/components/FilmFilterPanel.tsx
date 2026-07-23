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
    'rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:border-ring'

  return (
    <div className="mt-3 rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
          {activeCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={clear} className="text-sm text-muted-foreground hover:text-foreground">
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-4 py-3">
        {/* Genre category — single-select chips. */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                      ? 'bg-primary text-primary-foreground ring-2 ring-inset ring-ring/25'
                      : 'bg-card text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted'
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
              <span className="text-muted-foreground">–</span>
              <input
                value={filters.yearTo}
                onChange={(e) => update('yearTo', e.target.value)}
                placeholder="to"
                inputMode="numeric"
                className={`${field} w-20`}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
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
