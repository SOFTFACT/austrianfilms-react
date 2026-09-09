/**
 * The path prefix the app is served under — "" today (vite `base` is "/",
 * the app owns app.af.softfact.com), "/something" if it ever moves under a
 * prefix. One place, derived from BASE_URL, so the router basename, the hard
 * login redirect and the post-login return path agree.
 */
export const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** A window.location pathname → the router path (prefix removed). */
export function stripBase(pathname: string): string {
  if (BASE && (pathname === BASE || pathname.startsWith(`${BASE}/`))) return pathname.slice(BASE.length) || '/'
  return pathname
}
