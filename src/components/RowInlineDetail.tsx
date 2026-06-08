import type { ReactNode } from 'react'
import { ChevronsDownUp, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '../lib/utils'

export interface DetailField {
  label: string
  value: ReactNode
  /** Span the full grid width (e.g. free-text notes). */
  full?: boolean
}

interface RowInlineDetailProps {
  /** Optional preview image on the left (e.g. a film poster). */
  imageUrl?: string
  imageAlt?: string
  fields: DetailField[]
  /** Action buttons (e.g. "Open details") shown top-right next to the close button. */
  actions?: ReactNode
  onClose: () => void
}

/**
 * Inline row-detail panel rendered below an expanded list row. Combines the
 * artdimensions InlinePreview shell (image left, accent border, close button)
 * with the /hq tabulator `.detail-grid` (responsive label/value grid).
 */
export function RowInlineDetail({ imageUrl, imageAlt, fields, actions, onClose }: RowInlineDetailProps) {
  return (
    <div className="flex border-y-2 border-slate-900 bg-white" data-testid="row-inline-detail">
      {imageUrl && (
        <div className="hidden w-48 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 p-3 sm:flex">
          <img src={imageUrl} alt={imageAlt ?? ''} loading="lazy" className="max-h-64 max-w-full object-contain" />
        </div>
      )}
      <div className="min-w-0 flex-1 p-4">
        <div className="mb-3 flex items-center justify-end gap-2">
          {actions}
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse row"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
          {fields.map((f) => (
            <div key={f.label} className={cn('flex min-w-0 flex-col', f.full && 'col-span-2 md:col-span-4')}>
              <span className="mb-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">{f.label}</span>
              <span className="break-words text-sm text-slate-700">
                {f.value === '' || f.value == null ? '—' : f.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Header toggle that expands or collapses every currently-loaded row. */
export function ExpandAllButton({ allExpanded, onToggle }: { allExpanded: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
    >
      {allExpanded ? <ChevronsDownUp className="h-4 w-4" /> : <ChevronsUpDown className="h-4 w-4" />}
      {allExpanded ? 'Collapse all' : 'Expand all'}
    </button>
  )
}
