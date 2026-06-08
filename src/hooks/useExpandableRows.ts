import { useCallback, useState } from 'react'

/**
 * Tracks which list rows are expanded (inline accordion). Mirrors the /hq
 * tabulator row-detail behaviour: per-row toggle plus an "expand/collapse all"
 * that operates on the currently-loaded ids (infinite-scroll pages loaded after
 * an "expand all" stay collapsed — same as /hq's getRows() snapshot).
 */
export function useExpandableRows() {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded])

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const expandAll = useCallback((ids: string[]) => setExpanded(new Set(ids)), [])

  const collapseAll = useCallback(() => setExpanded(new Set()), [])

  return { expanded, isExpanded, toggle, expandAll, collapseAll }
}
