import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { LoaderCircle } from 'lucide-react'
import { measureScrollMargin, scrollAdapters, useScrollContainer, useScrollMargin } from '@softfact/react-kit'

export interface VirtualGridProps<T> {
  items: T[]
  /** Approximate height of one row of cards in px. Includes the bottom
   *  gap so the virtualizer's totalSize matches DOM measurements. */
  estimateRowSize: number
  /** Lower bound for an individual card width — same value used in the
   *  legacy `minmax(Xpx, 1fr)` grid so columns reflow at the same point. */
  cardMinWidth: number
  /** Pixel gap between cards (and between rows). Tailwind gap-5 ≈ 20. */
  cardGap: number
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  getItemKey?: (item: T, index: number) => string | number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => Promise<unknown> | void
  /** Rows from the end that trigger fetchNextPage. Default 3. */
  fetchTriggerRowOffset?: number
  rowClassName?: string
  className?: string
  testId?: string
}

/** ResizeObserver-backed cards-per-row counter. Falls back to 4 columns
 *  (`measured: false`) until the observer fires once — the anchor below must
 *  not treat that placeholder as a layout the reader has seen.
 *  cols = floor((width + gap) / (minWidth + gap)). */
function useCardsPerRow(
  targetRef: RefObject<HTMLElement | null>,
  cardMinWidth: number,
  cardGap: number,
): { count: number; measured: boolean } {
  const [state, setState] = useState({ count: 4, measured: false })
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const update = (width: number) => {
      const cols = Math.max(1, Math.floor((width + cardGap) / (cardMinWidth + cardGap)))
      setState((prev) => (prev.measured && prev.count === cols ? prev : { count: cols, measured: true }))
    }
    update(el.clientWidth)
    const ro = new ResizeObserver((entries) => update(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [targetRef, cardMinWidth, cardGap])
  return state
}

/**
 * Multi-column virtualized grid with constant card height, scrolling against
 * the app frame's container (or the window outside the frame). One virtual
 * row holds `cardsPerRow` cards laid out via plain CSS Grid so the gap stays
 * uniform.
 */
export function VirtualGrid<T>({
  items,
  estimateRowSize,
  cardMinWidth,
  cardGap,
  overscan = 2,
  renderItem,
  getItemKey,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
  fetchTriggerRowOffset = 3,
  rowClassName,
  className,
  testId,
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const { count: cardsPerRow, measured } = useCardsPerRow(parentRef, cardMinWidth, cardGap)
  const rowCount = Math.ceil(items.length / cardsPerRow)
  const container = useScrollContainer()
  const scrollMargin = useScrollMargin(parentRef, container)
  // Stable adapters: rebuilt per render they would hand TanStack fresh closures
  // on every scroll-driven re-render.
  const adapters = useMemo(() => scrollAdapters(container), [container])

  const virtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowSize,
    overscan,
    scrollMargin,
    ...adapters,
  })

  // Keep the reader's place when the column count changes. Collapsing or
  // expanding the sidebar widens/narrows the grid (animated, so the count can
  // step more than once); with more cards per row there are fewer rows, and the
  // same scrollTop would show different cards. Before paint, map the first
  // visible item — plus how far its row was scrolled past — onto the new row
  // layout. Row height is constant, so this is exact without measuring.
  const prevColsRef = useRef<number | null>(null) // null until the first MEASURED count
  // The item the last adjustment anchored on, and where it left the scroller.
  // Re-deriving the item from the row on every step drifts (row * 3 → / 4 →
  // * 4 → / 3 lands a row lower after collapse + expand), so as long as the
  // reader has not scrolled since, the same item stays the anchor.
  const lastAnchorRef = useRef<{ item: number; top: number } | null>(null)
  useLayoutEffect(() => {
    if (!measured) return
    const prevCols = prevColsRef.current
    prevColsRef.current = cardsPerRow
    // First measured count: nothing to map from. The 4-column placeholder was
    // never on screen — anchoring from it moved a restored 800 to 996.
    if (prevCols === null || prevCols === cardsPerRow) return
    // Read and write through the virtualizer: its offset cache is then the
    // one source of truth, whatever the scroll host is (see scrollAdapters).
    // The margin is measured live: the reflow that changes the column count
    // (sidebar toggle) often wraps the header in the same layout, and the
    // `scrollMargin` state still holds the previous render's value here.
    const el = parentRef.current
    if (!el) return
    const margin = measureScrollMargin(el, container)
    const top = virtualizer.scrollOffset ?? 0
    const offset = top - margin
    if (offset <= 0) return
    const rowPos = offset / estimateRowSize
    const firstRow = Math.floor(rowPos)
    const last = lastAnchorRef.current
    const anchorItem = last && Math.abs(last.top - top) < 2 ? last.item : firstRow * prevCols
    const newRow = Math.floor(anchorItem / cardsPerRow)
    const to = margin + (newRow + (rowPos - firstRow)) * estimateRowSize
    virtualizer.scrollToOffset(to)
    lastAnchorRef.current = { item: anchorItem, top: to }
  }, [cardsPerRow, measured, estimateRowSize, virtualizer, container])

  const rows = virtualizer.getVirtualItems()
  const lastRowIdx = rows.at(-1)?.index ?? 0

  useEffect(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage &&
      lastRowIdx >= rowCount - fetchTriggerRowOffset
    ) {
      fetchNextPage()
    }
  }, [lastRowIdx, rowCount, hasNextPage, isFetchingNextPage, fetchNextPage, fetchTriggerRowOffset])

  return (
    <div ref={parentRef} className={className} data-testid={testId}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {rows.map((row) => {
          const start = row.index * cardsPerRow
          const rowItems = items.slice(start, start + cardsPerRow)
          return (
            <div
              key={row.key}
              className={`absolute left-0 right-0 ${rowClassName ?? ''}`}
              style={{
                top: 0,
                height: estimateRowSize,
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              <div
                className="grid h-full"
                style={{
                  gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
                  gap: cardGap,
                }}
              >
                {/* display:contents makes renderItem's root the real grid item,
                    so a width:auto <button> fills 1fr instead of shrinking. */}
                {rowItems.map((item, j) => {
                  const idx = start + j
                  const key = getItemKey ? getItemKey(item, idx) : idx
                  return (
                    <div key={key} style={{ display: 'contents' }}>
                      {renderItem(item, idx)}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {isFetchingNextPage && (
        <div className="flex justify-center py-8 text-sm text-muted-foreground">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          Lade weitere…
        </div>
      )}
    </div>
  )
}
