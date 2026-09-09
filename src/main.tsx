import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API4DProvider, AuthProvider, _setModuleConfig, type API4DConfig } from '@softfact/api4d-react'
import { CacheFlushBinder } from '@/components/CacheFlushBinder'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { BASE } from '@/lib/base'
import './index.css'
import App from './App.tsx'

// AustrianFilms-specific API4D-library configuration. Same shared lib as
// MDS-Praxis (and, going forward, ECOline) — fixes to lib/api4d benefit all.
// storagePrefix keeps the historical key name (austrianfilms_token).
// Router basename and login route follow vite's `base` (lib/base.ts) — "/"
// today, so both are plain; the wiring stays in case the app ever moves
// under a path prefix.
const config: API4DConfig = {
  apiBase: '/api/v1',
  storagePrefix: 'austrianfilms',
  refreshPath: '/auth/refresh',
  healthPath: '/health',
  logoutPath: '/auth/logout',
  loginRoute: `${BASE}/login`,
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <API4DProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter basename={BASE || undefined}>
              <CacheFlushBinder />
              <App />
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </API4DProvider>
    </ThemeProvider>
  </StrictMode>,
)
