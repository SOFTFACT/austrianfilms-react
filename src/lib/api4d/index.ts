/**
 * API4D React Library — public surface.
 *
 * Everything imported from outside this folder must flow through this
 * barrel so the future extraction to a standalone npm package
 * (`@softfact/api4d-react`) is a no-op rename for consumers.
 */
export type {
  API4DConfig,
} from './configState'
export { useAPI4DConfig, _setModuleConfig } from './configState'
export { API4DProvider } from './config'

export type {
  Pagination,
  PagedResponse,
  ProblemDetails,
  AuthUser,
  LoginSuccess,
} from './types'

export { AuthProvider } from './AuthContext'
export {
  useAuth,
  getStoredToken,
  getStoredRefreshToken,
  getStoredUser,
  setStoredAuth,
  clearAuth,
} from './authState'

export {
  apiFetch,
  apiFetchBlob,
  ApiError,
  NetworkError,
  setForceLogoutCleanup,
  forceLogout,
  REDIRECT_AFTER_LOGIN_KEY,
} from './client'

export { ApiHealthProvider } from './ApiHealthContext'
export { useApiHealth } from './apiHealthState'

export { useDebounce, useInfiniteList, type PageParam } from './hooks'
