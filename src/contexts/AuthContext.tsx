import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { login as apiLogin, getCurrentUser } from '../api/auth'
import { getToken, setToken, clearToken, AuthContext } from './auth'
import type { CurrentUser } from '../types/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken())

  // On mount, if we have a token, try to load the current user. A 401 will
  // bubble through the api client which clears the token and redirects.
  useEffect(() => {
    if (getToken()) {
      getCurrentUser()
        .then((u) => {
          setUser(u)
          setIsAuthenticated(true)
        })
        .catch(() => {
          clearToken()
          setIsAuthenticated(false)
        })
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin({ username, password })
    setToken(res.token)
    setIsAuthenticated(true)
    if (res.user) {
      setUser(res.user)
    } else {
      try {
        setUser(await getCurrentUser())
      } catch {
        // user fetch is best-effort; token is what matters
      }
    }
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
