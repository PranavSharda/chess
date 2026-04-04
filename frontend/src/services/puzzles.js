import api from './api'

export const getPuzzles = async (params = {}) => {
  const response = await api.get('/puzzles', { params })
  return response.data
}

export const getPuzzle = async (puzzleId) => {
  const response = await api.get(`/puzzles/${puzzleId}`)
  return response.data
}

export const generatePuzzles = async () => {
  const response = await api.post('/puzzles/generate')
  return response.data
}

export const classifyStoredGame = async (gameId) => {
  const response = await api.post(`/games/${gameId}/classify-puzzle`)
  return response.data
}
