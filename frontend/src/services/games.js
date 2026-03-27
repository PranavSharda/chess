import api from './api'

export const fetchGames = async () => {
  const response = await api.get('/games')
  return response.data
}

export const fetchFromChessCom = async ({ timeframe = '3_months', gameTypes = ['rapid', 'blitz', 'bullet'] } = {}) => {
  const response = await api.post('/games/import', { timeframe, game_types: gameTypes })
  return response.data
}

export const getGame = async (gameId) => {
  const response = await api.get(`/games/${gameId}`)
  return response.data
}

export const linkChessComUsername = async (userId, username) => {
  const response = await api.patch(`/users/${userId}/chess-com`, {
    chess_com_username: username.toLowerCase(),
  })
  return response.data
}
