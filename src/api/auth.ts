import { apiClient } from './client'
import type { LoginRequest, LoginResponse, CurrentUser } from '../types/auth'

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', credentials, { skipAuth: true })
}

// /auth/me wraps the user object: { user: {...} } — unwrap it so callers
// get a flat CurrentUser (login returns the user un-nested, hence the
// post-reload "User" fallback before this fix).
export async function getCurrentUser(): Promise<CurrentUser> {
  const res = await apiClient.get<{ user: CurrentUser }>('/auth/me')
  return res.user
}
