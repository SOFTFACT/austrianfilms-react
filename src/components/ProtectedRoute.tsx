import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/api4d'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // On a cold page load (F5, deep link, or window.open'd tab) the auth state is
  // hydrated from localStorage inside a useEffect, so the first render is always
  // unauthenticated. Redirecting here would punt a logged-in user to /login.
  // Wait for the bootstrap to settle before deciding.
  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    // Preserve the full target (path + query + hash) so login can return there.
    const from = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from }} />
  }

  return <>{children}</>
}
