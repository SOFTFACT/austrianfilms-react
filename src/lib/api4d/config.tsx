import { type ReactNode } from 'react'
import { ConfigCtx, type API4DConfig } from './configState'

/**
 * Publishes the per-app API4D configuration (see configState.ts) to the React
 * tree. Mount this at the app root, above anything that issues API calls.
 */
export function API4DProvider({
  config,
  children,
}: {
  config: API4DConfig
  children: ReactNode
}) {
  return <ConfigCtx.Provider value={config}>{children}</ConfigCtx.Provider>
}
