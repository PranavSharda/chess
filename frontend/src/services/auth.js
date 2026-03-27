import api, { setToken } from './api'

export const signUp = async (data) => {
  const response = await api.post('/users', data)
  const { access_token, user } = response.data
  setToken(access_token)
  return user
}

export const signIn = async (data) => {
  const response = await api.post('/users/signin', {
    emailOrUsername: data.emailOrUsername,
    password: data.password,
  })
  const { access_token, user } = response.data
  setToken(access_token)
  return user
}

export const getMe = async () => {
  const response = await api.get('/users/me')
  return response.data
}
