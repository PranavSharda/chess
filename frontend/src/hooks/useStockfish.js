import { useState, useEffect, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'
import { analyzePosition } from '../engine/stockfishAnalysis'

export default function useStockfish(gamePosition) {
  const [analysis, setAnalysis] = useState(null)
  const [topLines, setTopLines] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  const fen = useMemo(() => {
    if (gamePosition === 'start' || !gamePosition) return new Chess().fen()
    return gamePosition
  }, [gamePosition])

  const analyze = useCallback(async () => {
    if (!fen) return
    setIsAnalyzing(true)
    setError(null)
    try {
      const data = await analyzePosition(fen)
      setAnalysis(data)
      setTopLines(data.top_lines || [])
    } catch (err) {
      console.error('Stockfish error:', err)
      setError(err?.message || 'Engine failed to load')
      setAnalysis(null)
      setTopLines([])
    } finally {
      setIsAnalyzing(false)
    }
  }, [fen])

  useEffect(() => {
    const t = setTimeout(analyze, 150)
    return () => clearTimeout(t)
  }, [analyze])

  return {
    analysis,
    topLines,
    evaluation: analysis?.evaluation || null,
    bestMove: analysis?.best_move || null,
    isAnalyzing,
    error,
  }
}
