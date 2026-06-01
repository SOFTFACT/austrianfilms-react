import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Loader2 } from 'lucide-react'
import { useScrollMargin } from './useScrollMargin'

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
 *  until the observer fires once. cols = floor((width + gap) / (minWidth + gap)). */
function useCardsPerRow(
  targetRef: RefObject<HTMLElement | null>,
  cardMinWidth: number,
  cardGap: number,
): number {
  const [count, setCount] = useState(4)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const update = (width: number) => {
      const cols = Math.max(1, Math.floor((width + cardGap) / (cardMinWidth + cardGap)))
      setCount(cols)
    }
    update(el.clientWidth)
    const ro = new ResizeObserver((entries) => update(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [targetRef, cardMinWidth, cardGap])
  return count
}

/**
 * Multi-column window-virtualized grid with constant card height. Ported
 * verbatim from artdimensions-react. One virtual row holds `cardsPerRow`
 * cards laid out via plain CSS Grid so the gap stays uniform.
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
  const cardsPerRow = useCardsPerRow(parentRef, cardMinWidth, cardGap)
  const rowCount = Math.ceil(items.length / cardsPerRow)
  const scrollMargin = useScrollMargin(parentRef)

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => estimateRowSize,
    overscan,
    scrollMargin,
  })

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
        <div className="flex justify-center py-8 text-sm text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Lade weitere…
        </div>
      )}
    </div>
  )
}
