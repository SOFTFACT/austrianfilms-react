import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  API4DProvider,
  AuthProvider,
  _setModuleConfig,
  setForceLogoutCleanup,
  type API4DConfig,
} from '@/lib/api4d'
import './index.css'
import App from './App.tsx'

// AustrianFilms-specific API4D-library configuration. Same shared lib as
// MDS-Praxis (and, going forward, ECOline) — fixes to lib/api4d benefit all.
// storagePrefix keeps the historical key name (austrianfilms_token).
const config: API4DConfig = {
  apiBase: '/api/v1',
  storagePrefix: 'austrianfilms',
  refreshPath: '/auth/refresh',
  healthPath: '/health',
  logoutPath: '/auth/logout',
  loginRoute: '/login',
}

// The module-level cache is read by the non-React HTTP client. Set it
// before any apiFetch call kicks off.
_setModuleConfig(config)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function CacheFlushBinder() {
  useEffect(() => {
    setForceLogoutCleanup(() => queryClient.clear())
    return () => setForceLogoutCleanup(null)
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <API4DProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <CacheFlushBinder />
            <App />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </API4DProvider>
  </StrictMode>,
)
