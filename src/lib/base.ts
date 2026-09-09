/**
 * The path prefix the app is served under — "/app" in this repo (vite `base`),
 * "" when served from a root. One place, derived from BASE_URL, so the router
 * basename, the hard login redirect and the post-login return path agree.
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** A window.location pathname → the router path (prefix removed). */
export function stripBase(pathname: string): string {
  if (BASE && (pathname === BASE || pathname.startsWith(`${BASE}/`))) return pathname.slice(BASE.length) || '/'
  return pathname
}
