import { FILM_GENRES, type FilmBoxFilters } from '../types/film'
import { FilterChip, FilterField, FilterSheet, filterInputCls } from './FilterSheet'

interface FilmFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilmBoxFilters
  update: <K extends keyof FilmBoxFilters>(key: K, value: FilmBoxFilters[K]) => void
  clear: () => void
  activeCount: number
}

/**
 * Filter drawer for the films list. Genre is a single-select chip group —
 * FM_filme.genre is one numeric category per film (1 Fiction / 2 Documentary /
 * 3 Hybrid), so picking a second genre replaces the first.
 */
export function FilmFilterPanel({
  open,
  onOpenChange,
  filters,
  update,
  clear,
  activeCount,
}: FilmFilterPanelProps) {
  return (
    <FilterSheet open={open} onOpenChange={onOpenChange} activeCount={activeCount} clear={clear}>
      <FilterField label="Genre">
        <div className="flex flex-wrap gap-1.5">
          {FILM_GENRES.map((g) => (
            <FilterChip
              key={g.value}
              active={filters.genre === g.value}
              onClick={() => update('genre', filters.genre === g.value ? '' : g.value)}
            >
              {g.label}
            </FilterChip>
          ))}
        </div>
      </FilterField>

      <FilterField label="Director">
        <input
          value={filters.director}
          onChange={(e) => update('director', e.target.value)}
          placeholder="Name…"
          className={filterInputCls}
        />
      </FilterField>

      <FilterField label="Sub-genre">
        <input
          value={filters.filmgenre}
          onChange={(e) => update('filmgenre', e.target.value)}
          placeholder="e.g. Long Documentary"
          className={filterInputCls}
        />
      </FilterField>

      <FilterField label="Production">
        <input
          value={filters.production}
          onChange={(e) => update('production', e.target.value)}
          placeholder="Company…"
          className={filterInputCls}
        />
      </FilterField>

      <FilterField label="Year">
        <div className="flex items-center gap-2">
          <input
            value={filters.yearFrom}
            onChange={(e) => update('yearFrom', e.target.value)}
            placeholder="from"
            inputMode="numeric"
            className={filterInputCls}
          />
          <span className="text-muted-foreground">–</span>
          <input
            value={filters.yearTo}
            onChange={(e) => update('yearTo', e.target.value)}
            placeholder="to"
            inputMode="numeric"
            className={filterInputCls}
          />
        </div>
      </FilterField>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.actualOnly === 'true'}
          onChange={(e) => update('actualOnly', e.target.checked ? 'true' : '')}
        />
        Current only
      </label>
    </FilterSheet>
  )
}
