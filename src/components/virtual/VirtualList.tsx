import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
} from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { Loader2 } from 'lucide-react'
import { useScrollMargin } from './useScrollMargin'
import { cn } from '../../lib/utils'

/** Imperative handle exposed via `ref`. Lets callers drive scroll
 *  declaratively (back-nav restore, deep-link to N) without reaching
 *  into TanStack's internals. */
export interface VirtualListHandle {
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => void
}

export interface VirtualListProps<T> {
  items: T[]
  /** Estimated row height in px. Used as initial estimate; with
   *  variableHeight=true real heights are measured after first render. */
  estimateSize: number
  /** Set true when row content can vary in height. Switches positioning
   *  from `transform` to `top` so TanStack's `measureElement` callback
   *  doesn't enter the ResizeObserver/setState loop. */
  variableHeight?: boolean
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  getItemKey?: (item: T, index: number) => string | number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => Promise<unknown> | void
  /** How many rows from the end to trigger fetchNextPage. Default 10. */
  fetchTriggerOffset?: number
  rowClassName?: string
  className?: string
  testId?: string
}

/**
 * Single-column window-virtualized list with optional infinite pagination.
 * Ported verbatim from artdimensions-react (CMP1-95) — keeps the proven
 * scrollMargin handling, the non-advancing-cursor guard (in useInfiniteList)
 * and the transform-vs-top positioning split that avoids the measureElement
 * render loop.
 */
function VirtualListInner<T>(
  {
    items,
    estimateSize,
    variableHeight = false,
    overscan = 5,
    renderItem,
    getItemKey,
    hasNextPage = false,
    isFetchingNextPage = false,
    fetchNextPage,
    fetchTriggerOffset = 10,
    rowClassName,
    className,
    testId,
  }: VirtualListProps<T>,
  ref: ForwardedRef<VirtualListHandle>,
) {
  const parentRef = useRef<HTMLDivElement>(null)
  const scrollMargin = useScrollMargin(parentRef)

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
  })

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, options) => {
        virtualizer.scrollToIndex(index, { align: options?.align ?? 'start' })
      },
    }),
    [virtualizer],
  )

  const rows = virtualizer.getVirtualItems()
  const lastIndex = rows.at(-1)?.index ?? 0

  useEffect(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage &&
      lastIndex >= items.length - fetchTriggerOffset
    ) {
      fetchNextPage()
    }
  }, [lastIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage, fetchTriggerOffset])

  return (
    <div ref={parentRef} className={className} data-testid={testId}>
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {rows.map((row) => {
          const item = items[row.index]
          if (item === undefined) return null
          const key = getItemKey ? getItemKey(item, row.index) : row.key

          if (variableHeight) {
            return (
              <div
                key={key}
                ref={virtualizer.measureElement}
                data-index={row.index}
                className={cn('absolute left-0 right-0', rowClassName)}
                style={{ top: row.start - virtualizer.options.scrollMargin }}
              >
                {renderItem(item, row.index)}
              </div>
            )
          }

          return (
            <div
              key={key}
              className={cn('absolute left-0 right-0', rowClassName)}
              style={{
                top: 0,
                height: estimateSize,
                transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)`,
              }}
            >
              {renderItem(item, row.index)}
            </div>
          )
        })}
      </div>
      {isFetchingNextPage && (
        <div className="flex justify-center py-6 text-xs text-slate-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Lade weitere…
        </div>
      )}
    </div>
  )
}

export const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: ForwardedRef<VirtualListHandle> },
) => ReactElement
