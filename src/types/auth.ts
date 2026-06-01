export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresAt?: string
  user?: CurrentUser
}

export interface CurrentUser {
  id?: string
  username: string
  email?: string
  role?: string
  groups?: { id?: string; name?: string }[]
}
