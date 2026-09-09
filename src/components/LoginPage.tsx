import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, ApiError, REDIRECT_AFTER_LOGIN_KEY } from '@softfact/api4d-react'
import { stripBase } from '@/lib/base'
import { login as apiLogin, me as apiMe } from '../api/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: setAuth } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Where to go after a successful login. Priority:
  //   1. sessionStorage (set by forceLogout on a mid-session expiry — survives
  //      the hard redirect that drops Router state). Read once and consumed.
  //   2. Router state.from (set on a cold-load bounce).
  //   3. the dashboard.
  const [from] = useState<string>(() => {
    try {
      const stashed = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY)
      if (stashed) {
        sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY)
        // forceLogout stores window.location.pathname, which carries the /app
        // prefix; navigate() adds the router basename again, so strip it here.
        return stripBase(stashed)
      }
    } catch {
      /* sessionStorage unavailable — fall through */
    }
    return (location.state as { from?: string })?.from || '/'
  })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await apiLogin({ username, password })
      const expAt = r.expires_in
        ? new Date(Date.now() + r.expires_in * 1000).toISOString()
        : null
      // The login payload carries {id, username, role} but no `groups`, and
      // its role is the pre-resolver default — only /auth/me runs the host's
      // group resolver. Store the session first (apiFetch reads the bearer
      // token from storage), then replace the user with the resolved one, so
      // any group-aware UI sees the real membership instead of nothing.
      setAuth(r.token, r.user, expAt, r.refresh_token)
      try {
        setAuth(r.token, await apiMe(), expAt, r.refresh_token)
      } catch {
        /* /auth/me unreachable — keep the login payload; the backend still gates */
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.problem.detail ?? err.problem.title ?? 'Sign-in failed')
          : 'Server not available',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-accent px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Austrian Films</h1>
        <p className="mt-1 text-sm text-muted-foreground">Backoffice — please sign in.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted-foreground">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
