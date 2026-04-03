import api from './api'

export const fetchGames = async (timeframe, timeClass) => {
  const params = {}
  if (timeframe) params.timeframe = timeframe
  if (timeClass) params.time_class = timeClass
  const response = await api.get('/games', { params })
  return response.data
}

export const fetchFromChessCom = async ({ timeframe, gameTypes = ['rapid', 'blitz', 'bullet'] } = {}) => {
  const payload = { game_types: gameTypes }
  if (timeframe) payload.timeframe = timeframe
  const response = await api.post('/games/import', payload)
  return response.data
}

export const getGame = async (gameId) => {
  const response = await api.get(`/games/${gameId}`)
  return response.data
}

export const saveGameAnalysis = async (gameId, data) => {
  const response = await api.patch(`/games/${gameId}`, data)
  return response.data
}

export const fetchCommonMistakes = async (timeframe, timeClass) => {
  const params = {}
  if (timeframe) params.timeframe = timeframe
  if (timeClass) params.time_class = timeClass
  const response = await api.get('/games/common-mistakes', { params })
  return response.data
}

export const linkChessComUsername = async (userId, username) => {
  const response = await api.patch(`/users/${userId}/chess-com`, {
    chess_com_username: username.toLowerCase(),
  })
  return response.data
}
