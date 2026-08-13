import { createContext, useContext } from 'react'

/**
 * Per-app configuration of the API4D library layer. Keeps storage keys,
 * endpoint paths, and the API base configurable so the same library
 * code runs against MDS-Praxis, ECOline, ArtDimensions, etc.
 *
 * When this library is extracted to a standalone package, this is the
 * single configuration surface every host must wire up before mounting
 * an <API4DProvider> at the app root.
 *
 * Everything here is non-component so that <API4DProvider> can live alone in
 * config.tsx and stay eligible for Fast Refresh.
 */
export interface API4DConfig {
  /** Base path for every API call, e.g. "/api/v1". */
  apiBase: string
  /** localStorage key prefix — distinguishes tokens from sibling apps
   *  on the same origin. e.g. "mds" → mds_token / mds_user / mds_expires_at. */
  storagePrefix: string
  /** POST endpoint that exchanges a stale Bearer for a fresh one.
   *  e.g. "/auth/refresh". */
  refreshPath: string
  /** GET endpoint that returns 200 when the backend is healthy.
   *  e.g. "/health". */
  healthPath: string
  /** POST endpoint that revokes the current Bearer (and any refresh tokens).
   *  e.g. "/auth/logout". */
  logoutPath: string
  /** Path the SPA navigates to after forceLogout(). */
  loginRoute: string
}

export const ConfigCtx = createContext<API4DConfig | null>(null)

export function useAPI4DConfig(): API4DConfig {
  const v = useContext(ConfigCtx)
  if (!v) {
    throw new Error('useAPI4DConfig must be used inside <API4DProvider>')
  }
  return v
}

// Module-level cache so the non-React HTTP client can read config without
// going through hooks. Wired by <API4DProvider> on mount.
let _moduleConfig: API4DConfig | null = null

export function _setModuleConfig(c: API4DConfig | null): void {
  _moduleConfig = c
}

export function _getModuleConfig(): API4DConfig {
  if (!_moduleConfig) {
    throw new Error(
      'API4D config not initialised — mount <API4DProvider> before any API call',
    )
  }
  return _moduleConfig
}
