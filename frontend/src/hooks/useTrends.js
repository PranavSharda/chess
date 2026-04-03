import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchGames, fetchFromChessCom, fetchCommonMistakes } from '../services/games'
import { useAnalysisQueue } from '../contexts/AnalysisQueueContext'

const STEPS = {
  IDLE: 'idle',
  IMPORTING: 'importing',
  ANALYSING: 'analysing',
  COMPUTING: 'computing',
  DONE: 'done',
  ERROR: 'error',
}

export default function useTrends(timeframe, timeClass) {
  const { enqueueGames, completedCount, totalQueued, isProcessing } = useAnalysisQueue()
  const [step, setStep] = useState(STEPS.IDLE)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [gameStats, setGameStats] = useState({ total: 0, unanalysed: 0 })
  const waitingForAnalysis = useRef(false)
  const lastRunKey = useRef(null)
  const activeFilters = useRef({ timeframe: null, timeClass: null })

  const run = useCallback(async (tf, tc) => {
    setStep(STEPS.IMPORTING)
    setError(null)
    setData(null)
    waitingForAnalysis.current = false
    activeFilters.current = { timeframe: tf, timeClass: tc || null }

    try {
      // Step 1: Import from Chess.com
      await fetchFromChessCom({
        timeframe: tf,
        gameTypes: tc ? [tc] : ['rapid', 'blitz', 'bullet'],
      })

      // Step 2: Get games within timeframe
      const { games } = await fetchGames(tf, tc)
      const unanalysed = games.filter((g) => !g.is_analysed)
      setGameStats({ total: games.length, unanalysed: unanalysed.length })

      if (unanalysed.length > 0) {
        // Step 3: Analyse unanalysed games
        setStep(STEPS.ANALYSING)
        waitingForAnalysis.current = true
        enqueueGames(unanalysed)
      } else {
        // All already analysed — go straight to computing
        setStep(STEPS.COMPUTING)
        const result = await fetchCommonMistakes(tf, tc)
        setData(result)
        setStep(STEPS.DONE)
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong')
      setStep(STEPS.ERROR)
    }
  }, [enqueueGames])

  // Trigger run when filters change
  useEffect(() => {
    if (!timeframe) {
      lastRunKey.current = null
      waitingForAnalysis.current = false
      activeFilters.current = { timeframe: null, timeClass: null }
      setStep(STEPS.IDLE)
      setData(null)
      setError(null)
      setGameStats({ total: 0, unanalysed: 0 })
      return
    }
    const runKey = `${timeframe}:${timeClass || 'all'}`
    if (runKey === lastRunKey.current) return
    lastRunKey.current = runKey
    run(timeframe, timeClass)
  }, [timeframe, timeClass, run])

  // Watch analysis queue — when done, fetch common mistakes
  useEffect(() => {
    if (!waitingForAnalysis.current) return
    if (!isProcessing && completedCount > 0 && completedCount >= totalQueued) {
      waitingForAnalysis.current = false
      setStep(STEPS.COMPUTING)
      fetchCommonMistakes(activeFilters.current.timeframe, activeFilters.current.timeClass)
        .then((result) => {
          setData(result)
          setStep(STEPS.DONE)
        })
        .catch((err) => {
          setError(err.response?.data?.detail || err.message || 'Failed to compute trends')
          setStep(STEPS.ERROR)
        })
    }
  }, [isProcessing, completedCount, totalQueued])

  return {
    step,
    openingMistakes: data?.opening_mistakes ?? [],
    endgameMistakes: data?.endgame_mistakes ?? [],
    totalAnalysed: data?.total_analysed ?? 0,
    gameStats,
    analysisProgress: { completed: completedCount, total: totalQueued },
    error,
    isEmpty: step === STEPS.DONE && data?.opening_mistakes?.length === 0 && data?.endgame_mistakes?.length === 0,
    STEPS,
  }
}
