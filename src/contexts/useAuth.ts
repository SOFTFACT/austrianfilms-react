import { useContext } from 'react'
import { AuthContext } from './auth'
import type { AuthContextValue } from './auth'

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
