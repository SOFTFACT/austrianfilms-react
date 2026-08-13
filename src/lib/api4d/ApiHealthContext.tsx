import { useEffect, useState, type ReactNode } from 'react'
import { _getModuleConfig } from './configState'
import { setNetworkErrorHandlers, clearNetworkErrorHandlers } from './client'
import { ApiHealthCtx } from './apiHealthState'

/**
 * Tracks "is the backend reachable?" so the app can render an overlay
 * when fetch starts throwing NetworkError. Wires itself into the
 * apiFetch error-handlers on mount so any failing request flips the
 * health flag immediately — no separate polling needed during normal
 * operation. Active polling kicks in only while we're already known
 * to be down, until a recovery hit comes through.
 */
export function ApiHealthProvider({ children }: { children: ReactNode }) {
  const [up, setUp] = useState(true)

  useEffect(() => {
    setNetworkErrorHandlers(
      () => setUp(false),
      () => setUp(true),
    )
    return () => clearNetworkErrorHandlers()
  }, [])

  // While down, poll the configured health endpoint every 4 s so the
  // overlay can dismiss itself as soon as the backend reappears.
  useEffect(() => {
    if (up) return
    const cfg = _getModuleConfig()
    const tick = async () => {
      try {
        const res = await fetch(`${cfg.apiBase}${cfg.healthPath}`)
        if (res.ok) setUp(true)
      } catch {
        /* still down */
      }
    }
    const id = window.setInterval(tick, 4000)
    return () => window.clearInterval(id)
  }, [up])

  return (
    <ApiHealthCtx.Provider value={{ isServerAvailable: up }}>{children}</ApiHealthCtx.Provider>
  )
}
