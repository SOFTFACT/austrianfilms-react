import { _getModuleConfig } from './config'
import { getStoredToken, getStoredRefreshToken, setStoredAuth, clearAuth } from './AuthContext'
import type { LoginSuccess, ProblemDetails } from './types'

/**
 * API errors carry the RFC 7807 problem body verbatim. UIs read `.detail`
 * for human messages and `.type` for stable error-class lookup.
 */
export class ApiError extends Error {
  status: number
  problem: ProblemDetails
  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail || problem.title || `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

/** Thrown when the backend is unreachable (TCP refused, DNS, proxy down). */
export class NetworkError extends Error {
  constructor(message = 'Server not available') {
    super(message)
    this.name = 'NetworkError'
  }
}

// ---------------------------------------------------------------------------
// Network-error callbacks (wired from <ApiHealthProvider>).
// Optional — apps that don't need an "Offline" overlay can ignore them.

type NetCb = (e: NetworkError) => void
type RecCb = () => void
let _onNetworkError: NetCb | null = null
let _onNetworkRecovery: RecCb | null = null
let _lastWasNetworkError = false

export function setNetworkErrorHandlers(onErr: NetCb, onRec: RecCb): void {
  _onNetworkError = onErr
  _onNetworkRecovery = onRec
}

export function clearNetworkErrorHandlers(): void {
  _onNetworkError = null
  _onNetworkRecovery = null
}

// ---------------------------------------------------------------------------
// Force-logout — global, idempotent, called on terminal 401 after refresh
// failure. The cache-flush callback is the app's chance to clear React
// Query so pending queries don't fire one last 401 before navigation.

let _onForceLogoutCleanup: (() => void) | null = null
let _isRedirecting = false

export function setForceLogoutCleanup(fn: (() => void) | null): void {
  _onForceLogoutCleanup = fn
}

export function forceLogout(): void {
  if (_isRedirecting) return
  _isRedirecting = true
  clearAuth()
  try {
    _onForceLogoutCleanup?.()
  } catch {
    /* defensive — cleanup must not block redirect */
  }
  window.location.replace(_getModuleConfig().loginRoute)
}

// ---------------------------------------------------------------------------
// Refresh — single in-flight promise. Many parallel 401s share the
// same refresh call, all retried with the resulting new token.

let _refreshing = false
let _refreshPromise: Promise<string | null> | null = null

async function tryRefresh(): Promise<string | null> {
  if (_refreshing && _refreshPromise) return _refreshPromise
  _refreshing = true
  _refreshPromise = performRefresh().finally(() => {
    _refreshing = false
    _refreshPromise = null
  })
  return _refreshPromise
}

async function performRefresh(): Promise<string | null> {
  // The server's /auth/refresh expects the rotating refresh token in the body
  // (not a Bearer access token). Each call is one-time-use and returns a fresh
  // refresh token — persist it so the next refresh uses the rotated one,
  // otherwise the server's reuse-detection revokes the whole family.
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return null
  const cfg = _getModuleConfig()
  try {
    const res = await fetch(`${cfg.apiBase}${cfg.refreshPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as LoginSuccess
    if (!body.token) return null
    const expAt = body.expires_in
      ? new Date(Date.now() + body.expires_in * 1000).toISOString()
      : null
    setStoredAuth(body.token, body.user, expAt, body.refresh_token)
    return body.token
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// apiFetch — the only HTTP entry point. Type the response with <T>.

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  // skipAuth: for pre-session calls (login, verify-otp) — don't attach a Bearer
  // and don't treat a 401 as an expired session (no silent refresh/forceLogout).
  const { skipAuth, ...fetchOptions } = options
  const cfg = _getModuleConfig()
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  }
  if (!skipAuth && token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${cfg.apiBase}${endpoint}`, { ...fetchOptions, headers })
  } catch (err: unknown) {
    const netErr = new NetworkError(
      err instanceof Error ? err.message : 'Server not available',
    )
    _lastWasNetworkError = true
    _onNetworkError?.(netErr)
    throw netErr
  }

  // 5xx with empty/HTML body → treat as backend unreachable (Vite-Proxy
  // returns this when 4D server is down). 5xx with valid JSON → real API error.
  if (res.status >= 500) {
    const body = await res.text()
    if (!body || body.startsWith('<!') || body.includes('ECONNREFUSED')) {
      const netErr = new NetworkError('Backend server is not available')
      _lastWasNetworkError = true
      _onNetworkError?.(netErr)
      throw netErr
    }
    try {
      throw new ApiError(res.status, JSON.parse(body) as ProblemDetails)
    } catch (err) {
      if (err instanceof ApiError) throw err
      throw new ApiError(res.status, {
        type: 'about:blank',
        title: 'Server error',
        status: res.status,
        detail: body || 'Server error',
      })
    }
  }

  if (_lastWasNetworkError) {
    _lastWasNetworkError = false
    _onNetworkRecovery?.()
  }

  // 401 → try silent refresh once, then retry. Failure path → forceLogout.
  // skipAuth calls (login, verify-otp) are pre-session: a 401 is a normal
  // "bad credentials / wrong code" answer, so surface it as an ApiError
  // instead of refreshing + forcing a logout.
  if (res.status === 401) {
    if (skipAuth) {
      const p = (await res.json().catch(() => ({}))) as ProblemDetails
      throw new ApiError(401, p)
    }
    const fresh = await tryRefresh()
    if (fresh) {
      headers.Authorization = `Bearer ${fresh}`
      const retry = await fetch(`${cfg.apiBase}${endpoint}`, { ...fetchOptions, headers })
      if (!retry.ok) {
        const p = (await retry.json().catch(() => ({}))) as ProblemDetails
        throw new ApiError(retry.status, p)
      }
      return retry.status === 204 ? (undefined as T) : ((await retry.json()) as T)
    }
    forceLogout()
    throw new ApiError(401, {
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Session expired',
    })
  }

  if (!res.ok) {
    const p = (await res.json().catch(() => ({}))) as ProblemDetails
    throw new ApiError(res.status, p)
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}
