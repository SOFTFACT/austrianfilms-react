import { cn } from '../lib/utils'

export interface SortState {
  field: string
  order: 'asc' | 'desc'
}

/** Toggle helper: same field flips order, a new field starts ascending. */
export function nextSort(s: SortState, field: string): SortState {
  return s.field === field ? { field, order: s.order === 'asc' ? 'desc' : 'asc' } : { field, order: 'asc' }
}

/** Click-to-sort column header with an active-direction arrow. */
export function SortHeader({
  label,
  field,
  sort,
  onSort,
  className,
}: {
  label: string
  field: string
  sort: SortState
  onSort: (field: string) => void
  className?: string
}) {
  const active = sort.field === field
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn('flex items-center gap-1 uppercase hover:text-slate-700', active && 'text-slate-700', className)}
    >
      <span className="truncate">{label}</span>
      {active && <span aria-hidden>{sort.order === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )
}
