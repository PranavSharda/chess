import { useState, useEffect } from 'react'
import { getGame } from '../services/games'

export default function useGame(gameId) {
  const [game, setGame] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!gameId) {
      setIsLoading(false)
      setError('No game ID provided')
      return
    }

    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getGame(gameId)
        if (!cancelled) setGame(data)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || err.message || 'Failed to load game')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [gameId])

  return { game, isLoading, error }
}
