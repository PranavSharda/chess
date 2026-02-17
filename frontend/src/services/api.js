import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Token helpers ──────────────────────────────────────────────
export const getToken = () => localStorage.getItem('token')
export const setToken = (token) => localStorage.setItem('token', token)
export const removeToken = () => localStorage.removeItem('token')

/**
 * Decode a JWT payload without verification (client-side only).
 * Returns null if the token is missing or malformed.
 */
export const decodeToken = () => {
  const token = getToken()
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * Check if the stored token is expired using the exp claim (Unix seconds).
 * Returns true if there is no token, no exp, or exp is in the past.
 */
export const isTokenExpired = () => {
  const claims = decodeToken()
  if (!claims?.exp) return true
  const expMs = claims.exp * 1000
  return Date.now() >= expMs
}

// ── Axios request interceptor: attach Bearer token ─────────────
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Axios response interceptor: auto-logout on 401 ────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      if (
        !window.location.pathname.startsWith('/signin') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth API calls ─────────────────────────────────────────────
export const signUp = async (data) => {
  const response = await api.post('/user', data)
  const { access_token, user } = response.data
  setToken(access_token)
  return user
}

export const signIn = async (data) => {
  const response = await api.post('/user/signin', {
    emailOrUsername: data.emailOrUsername,
    password: data.password,
  })
  const { access_token, user } = response.data
  setToken(access_token)
  return user
}

export const getMe = async () => {
  const response = await api.get('/user/me')
  return response.data
}

export const logout = () => {
  removeToken()
}

export default api
