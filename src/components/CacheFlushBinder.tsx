import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { setForceLogoutCleanup } from '@softfact/api4d-react'

/**
 * Renders nothing. Hands the api4d library the cache wipe it runs on a forced
 * logout, so the next user never sees rows fetched for the previous one. Must
 * be mounted inside QueryClientProvider.
 *
 * Lives here rather than in main.tsx so the entry file holds no component of
 * its own (react-refresh/only-export-components).
 */
export function CacheFlushBinder() {
  const queryClient = useQueryClient()

  useEffect(() => {
    setForceLogoutCleanup(() => queryClient.clear())
    return () => setForceLogoutCleanup(null)
  }, [queryClient])

  return null
}
