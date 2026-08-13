import { createContext, useContext } from 'react'
import { _getModuleConfig } from './configState'
import type { AuthUser } from './types'

/**
 * Auth state lives in localStorage so a page reload doesn't punt the user
 * back to /login. The module-level read/write helpers below are the
 * single source of truth — the React context only mirrors them so the
 * UI re-renders on change.
 *
 * Storage keys are derived from API4DConfig.storagePrefix so multiple
 * SPAs can coexist on the same origin without trampling each other.
 *
 * Everything here is non-component so that <AuthProvider> can live alone in
 * AuthContext.tsx and stay eligible for Fast Refresh.
 */
export const EVENT_NAME = 'api4d-auth-changed'

export function keys() {
  const p = _getModuleConfig().storagePrefix
  return {
    token: `${p}_token`,
    user: `${p}_user`,
    expires: `${p}_expires_at`,
    refresh: `${p}_refresh_token`,
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(keys().token)
  } catch {
    return null
  }
}

// Durable rotating refresh token (one-time-use, reuse-detected server-side).
// Stored only in localStorage — the React state never needs it; performRefresh
// reads it to renew the short-lived access token.
export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(keys().refresh)
  } catch {
    return null
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(keys().user)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function setStoredAuth(
  token: string,
  user: AuthUser,
  expiresAt?: string | null,
  refreshToken?: string | null,
): void {
  const k = keys()
  localStorage.setItem(k.token, token)
  // Guard: a missing user must never be persisted. JSON.stringify(undefined)
  // is undefined, which localStorage coerces to the string "undefined" — that
  // later throws in getStoredUser()'s JSON.parse and silently logs the user
  // out. Callers without a fresh user (e.g. token-only refresh) keep the
  // stored one untouched.
  if (user) {
    localStorage.setItem(k.user, JSON.stringify(user))
  }
  if (expiresAt) {
    localStorage.setItem(k.expires, expiresAt)
  } else {
    localStorage.removeItem(k.expires)
  }
  // Only overwrite the refresh token when a new one is supplied (login or a
  // rotation). A response that omits it must not wipe the stored one.
  if (refreshToken) {
    localStorage.setItem(k.refresh, refreshToken)
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function clearAuth(): void {
  const k = keys()
  localStorage.removeItem(k.token)
  localStorage.removeItem(k.user)
  localStorage.removeItem(k.expires)
  localStorage.removeItem(k.refresh)
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  expiresAt: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface AuthContextValue extends AuthState {
  login: (
    token: string,
    user: AuthUser,
    expiresAt?: string | null,
    refreshToken?: string | null,
  ) => void
  logout: () => void
}

export const AuthCtx = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be inside <AuthProvider>')
  return v
}
