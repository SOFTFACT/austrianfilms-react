/**
 * Standard pagination envelope produced by cs.API4D.Response.paginatedJSON
 * on every list endpoint. `nextCursor` is null in offset-mode or on the
 * last page; populated whenever the host runs cursor-pagination
 * (see CURSOR_PAGINATION.md in the API4D repo).
 *
 * This shape is the contract between API4D-hosted backends and any
 * frontend consuming them — keep it in sync with the component output.
 */
export interface Pagination {
  total: number
  limit: number
  offset: number
  page: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
  nextCursor?: string | null
}

export interface PagedResponse<T> {
  data: T[]
  pagination: Pagination
}

/**
 * RFC 7807 problem+json shape. cs.API4D.Response.problem produces this.
 */
export interface ProblemDetails {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
  errors?: Array<{ field: string; message: string }>
}

/**
 * User shape returned by /auth/login + /auth/me. id/username/role are the
 * common core; email/groups are optional so hosts that need them (ECOline's
 * RBAC nav-gating reads groups) get them typed, while hosts that don't simply
 * leave them unset. Keep this a superset so the lib stays identical everywhere.
 */
export interface AuthUser {
  id: string
  username: string
  role?: string
  email?: string
  /** Area groups for RBAC nav-gating (ECOline). Other hosts leave unset. */
  groups?: { id?: number; name: string }[]
}

export interface LoginSuccess {
  token: string
  type: 'Bearer'
  expires_in: number
  user: AuthUser
  refresh_token?: string
  refresh_expires_in?: number
}
