import { getToken, clearToken } from '../contexts/auth'

const API_BASE = '/api/v1'

export interface ApiError {
  status: number
  title: string
  detail?: string
  type?: string
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers)

  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth) {
    const token = getToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers })

  if (res.status === 401) {
    clearToken()
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    throw { status: 401, title: 'Unauthorized' } as ApiError
  }

  if (!res.ok) {
    let errorBody: Partial<ApiError> = {}
    try {
      errorBody = await res.json()
    } catch {
      // non-JSON error body
    }
    throw {
      status: res.status,
      title: errorBody.title || `Error ${res.status}`,
      detail: errorBody.detail,
      type: errorBody.type,
    } as ApiError
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json()
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}
