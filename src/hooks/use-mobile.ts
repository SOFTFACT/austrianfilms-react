import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Created once and cached: getSnapshot runs on every render, so it must not
// allocate a new MediaQueryList each time.
let mediaQuery: MediaQueryList | undefined
function getMediaQuery(): MediaQueryList {
  return (mediaQuery ??= window.matchMedia(MOBILE_QUERY))
}

function subscribe(onStoreChange: () => void): () => void {
  const mql = getMediaQuery()
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

/**
 * Deviates from the shadcn/ui original on purpose. That version seeded the
 * state with `undefined` and filled it in from an effect, which reports "not
 * mobile" on the first render (the sidebar renders desktop-wide, then snaps)
 * and trips react-hooks/set-state-in-effect. useSyncExternalStore is the
 * built-in way to read an external source and has the right value immediately.
 */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, () => getMediaQuery().matches)
}
