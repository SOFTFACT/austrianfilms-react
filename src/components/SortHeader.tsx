import { cn } from '../lib/utils'
import type { SortState } from '../lib/sort'

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
      className={cn('flex items-center gap-1 uppercase hover:text-foreground', active && 'text-foreground', className)}
    >
      <span className="truncate">{label}</span>
      {active && <span aria-hidden>{sort.order === 'asc' ? '▲' : '▼'}</span>}
    </button>
  )
}
