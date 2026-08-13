import { useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  AuthCtx,
  EVENT_NAME,
  keys,
  getStoredUser,
  setStoredAuth,
  clearAuth,
  type AuthState,
} from './authState'
import type { AuthUser } from './types'

/**
 * Mirrors the localStorage-backed auth state (see authState.ts) into React so
 * the UI re-renders on login/logout — including logout in another tab, via the
 * "storage" event.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    expiresAt: null,
    isAuthenticated: false,
    isLoading: true,
  })

  useEffect(() => {
    const sync = () => {
      const k = keys()
      const token = localStorage.getItem(k.token)
      const expiresAt = localStorage.getItem(k.expires)
      // getStoredUser is try/catch-safe — a corrupt stored user value (including
      // the literal strings "undefined"/"null") must never throw here, or the
      // whole app blanks, since AuthProvider wraps it all.
      const user = getStoredUser()
      setState({
        token,
        user,
        expiresAt,
        isAuthenticated: !!token && !!user,
        isLoading: false,
      })
    }
    sync()
    window.addEventListener(EVENT_NAME, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVENT_NAME, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const login = useCallback(
    (
      token: string,
      user: AuthUser,
      expiresAt?: string | null,
      refreshToken?: string | null,
    ) => {
      setStoredAuth(token, user, expiresAt ?? null, refreshToken ?? null)
    },
    [],
  )

  const logout = useCallback(() => {
    clearAuth()
  }, [])

  return <AuthCtx.Provider value={{ ...state, login, logout }}>{children}</AuthCtx.Provider>
}
