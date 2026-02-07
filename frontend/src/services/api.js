import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const signUp = async (data) => {
  const response = await api.post('/user', data)
  return response.data
}

export const signIn = async (data) => {
  const response = await api.post('/user/signin', {
    emailOrUsername: data.emailOrUsername,
    password: data.password
  })
  return response.data
}

export default api

