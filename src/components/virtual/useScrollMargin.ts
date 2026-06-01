import { useLayoutEffect, useState, type RefObject } from 'react'

/**
 * Live scrollMargin for a window-virtualized list.
 *
 * `useWindowVirtualizer` needs `scrollMargin` = the distance from the top of
 * the document to the top of the list container, so it can map window scroll
 * position to row indices. Reading `ref.current?.offsetTop` once at render is
 * wrong twice over:
 *
 *  1. On the FIRST render `ref.current` is null → margin 0 → the virtualizer
 *     thinks the list starts at y=0 (above the header) → it over-renders rows
 *     near the top, which trips the auto-fetch trigger and pulls extra pages
 *     nobody scrolled to.
 *  2. When anything ABOVE the list changes height — a sticky header growing
 *     because a filter panel expands, a search row wrapping, etc. — the
 *     list's offsetTop shifts but the cached margin doesn't, so the visible
 *     row window is miscalculated again.
 *
 * This hook measures offsetTop after layout and re-measures whenever the page
 * reflows (ResizeObserver on <body>), keeping the margin honest. Returns 0
 * until the first measurement, then the live value.
 */
export function useScrollMargin(ref: RefObject<HTMLElement | null>): number {
  const [margin, setMargin] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const next = el.offsetTop
      setMargin((prev) => (prev === next ? prev : next))
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [ref])

  return margin
}
