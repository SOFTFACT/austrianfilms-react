// Token storage + context definition (kept separate from the provider
// component so Fast Refresh stays happy: this file exports no components).
import { createContext } from 'react'
import type { CurrentUser } from '../types/auth'

const TOKEN_KEY = 'austrianfilms_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export interface AuthContextValue {
  isAuthenticated: boolean
  user: CurrentUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
