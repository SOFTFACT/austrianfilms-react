import { apiFetch } from '@/lib/api4d'
import type { AuthUser, LoginSuccess } from '@/lib/api4d'

// AustrianFilms auth endpoints. The shared lib/api4d handles refresh +
// Bearer attachment + ApiError parsing — these functions only declare the
// shape of each request/response pair.
export interface LoginPayload {
  username: string
  password: string
}

// skipAuth: login is pre-session, so a 401 is a normal "wrong credentials"
// answer and not an expired session. Without it the shared client treats the
// 401 as a dead session, attempts a silent refresh and then force-logs-out —
// which hard-redirects to /login and wipes the error message before the user
// ever sees why the sign-in failed.
export function login(payload: LoginPayload): Promise<LoginSuccess> {
  return apiFetch<LoginSuccess>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  })
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiFetch<void>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
  })
}

interface MeResponse {
  user: AuthUser
}

// /auth/me wraps the user object: { user: {...} } — unwrap it so callers
// get a flat AuthUser.
export async function me(): Promise<AuthUser> {
  const r = await apiFetch<MeResponse>('/auth/me')
  return r.user
}
