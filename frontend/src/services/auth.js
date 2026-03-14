import api, { setToken } from './api'

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
