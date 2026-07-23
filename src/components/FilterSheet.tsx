import { type ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface FilterSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Number of filters currently set — shown as a badge next to the title. */
  activeCount: number
  clear: () => void
  children: ReactNode
}

/**
 * Shared right-hand drawer that hosts a list's filter fields. One shell for
 * every list (films, itineraries, …) so the header/footer affordances stay
 * identical: active-count badge, a "Clear all" that only appears when there is
 * something to clear, and a Done button.
 *
 * Filters apply live as they are edited — the footer's Done merely dismisses
 * the drawer, so there is no pending/apply state to keep in sync.
 */
export function FilterSheet({ open, onOpenChange, activeCount, clear, children }: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {activeCount} active
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Narrow the list down. Changes apply immediately.
          </SheetDescription>
        </SheetHeader>

        {/* The field area is the only scroll container, so header and footer
            stay pinned however long the filter set grows. */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">{children}</div>

        <SheetFooter className="flex-row gap-2 border-t border-border">
          <button
            type="button"
            onClick={clear}
            disabled={activeCount === 0}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/** Labelled filter field — uniform label styling across all filter drawers. */
export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

/** Shared input styling for filter fields — full width inside the drawer. */
export const filterInputCls =
  'w-full rounded-lg border border-border px-2.5 py-1.5 text-sm outline-none focus:border-ring'

/** Chip used by the single/multi-select filter groups. */
export function FilterChip({
  active,
  onClick,
  activeClassName = 'bg-primary text-primary-foreground ring-2 ring-inset ring-ring/25',
  children,
}: {
  active: boolean
  onClick: () => void
  /** Overrides the active look — used where the chip carries a status colour. */
  activeClassName?: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? activeClassName
          : 'bg-card text-muted-foreground ring-1 ring-inset ring-border hover:bg-muted'
      }`}
    >
      {children}
    </button>
  )
}
