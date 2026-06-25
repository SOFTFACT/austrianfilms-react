/**
 * API4D React Library — public surface.
 *
 * Everything imported from outside this folder must flow through this
 * barrel so the future extraction to a standalone npm package
 * (`@softfact/api4d-react`) is a no-op rename for consumers.
 */
export type {
  API4DConfig,
} from './config'
export { API4DProvider, useAPI4DConfig, _setModuleConfig } from './config'

export type {
  Pagination,
  PagedResponse,
  ProblemDetails,
  AuthUser,
  LoginSuccess,
} from './types'

export {
  AuthProvider,
  useAuth,
  getStoredToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredAuth,
  clearAuth,
} from './AuthContext'

export {
  apiFetch,
  ApiError,
  NetworkError,
  setForceLogoutCleanup,
  forceLogout,
} from './client'

export { ApiHealthProvider, useApiHealth } from './ApiHealthContext'

export { useDebounce, useInfiniteList, type PageParam } from './hooks'
