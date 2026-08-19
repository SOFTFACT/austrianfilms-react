/**
 * Sort state shared by the list pages and the SortHeader component. Kept out of
 * SortHeader.tsx so that file exports nothing but its component, which is what
 * Fast Refresh needs to hot-swap it (react-refresh/only-export-components).
 */
export interface SortState {
  field: string
  order: 'asc' | 'desc'
}

/** Toggle helper: same field flips order, a new field starts ascending. */
export function nextSort(s: SortState, field: string): SortState {
  return s.field === field ? { field, order: s.order === 'asc' ? 'desc' : 'asc' } : { field, order: 'asc' }
}
