import { useState, useEffect, useCallback } from 'react'
import { getPuzzles } from '../services/puzzles'

export default function usePuzzles() {
  const [puzzles, setPuzzles] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPuzzles = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getPuzzles()
      setPuzzles(data.puzzles || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load puzzles')
      setPuzzles([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPuzzles()
  }, [loadPuzzles])

  return {
    puzzles,
    total,
    isLoading,
    error,
    refresh: loadPuzzles,
  }
}
