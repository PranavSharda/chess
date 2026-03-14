import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchGames, fetchFromChessCom } from '../services/games'
import { GAMES_PER_PAGE } from '../utils/constants'

export default function useGames(isLinked) {
  const [games, setGames] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFetchingChessCom, setIsFetchingChessCom] = useState(false)
  const hasAutoFetched = useRef(false)

  const loadGames = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await fetchGames()
      setGames(data.games || [])
      setTotal(data.total || 0)
      setPage(1)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch games')
      setGames([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchFromChessComAndReload = useCallback(async (timeframe = '3_months') => {
    setIsFetchingChessCom(true)
    setError('')
    try {
      await fetchFromChessCom({ timeframe })
      await loadGames()
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch from Chess.com')
    } finally {
      setIsFetchingChessCom(false)
    }
  }, [loadGames])

  useEffect(() => {
    if (isLinked) loadGames()
  }, [isLinked, loadGames])

  useEffect(() => {
    if (!isLinked || hasAutoFetched.current) return
    hasAutoFetched.current = true
    setIsFetchingChessCom(true)
    fetchFromChessCom({ timeframe: '3_months' })
      .then(() => loadGames())
      .catch(() => {})
      .finally(() => setIsFetchingChessCom(false))
  }, [isLinked, loadGames])

  const totalPages = Math.ceil(total / GAMES_PER_PAGE)
  const paginatedGames = games.slice((page - 1) * GAMES_PER_PAGE, page * GAMES_PER_PAGE)

  return {
    games: paginatedGames,
    allGames: games,
    total,
    page,
    setPage,
    totalPages,
    isLoading,
    isFetchingChessCom,
    error,
    refresh: loadGames,
    fetchFromChessCom: fetchFromChessComAndReload,
  }
}
