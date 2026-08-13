import { createContext, useContext } from 'react'

/**
 * Context surface for the "is the backend reachable?" flag. Non-component so
 * that <ApiHealthProvider> can live alone in ApiHealthContext.tsx and stay
 * eligible for Fast Refresh.
 */
export interface ApiHealthContextValue {
  isServerAvailable: boolean
}

export const ApiHealthCtx = createContext<ApiHealthContextValue>({
  isServerAvailable: true,
})

export function useApiHealth(): ApiHealthContextValue {
  return useContext(ApiHealthCtx)
}
