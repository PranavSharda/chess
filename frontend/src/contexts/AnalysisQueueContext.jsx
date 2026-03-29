import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { analyzeFullGame } from '../engine/analyzeFullGame'
import { saveGameAnalysis } from '../services/games'

const AnalysisQueueContext = createContext(null)

export function useAnalysisQueue() {
  const ctx = useContext(AnalysisQueueContext)
  if (!ctx) throw new Error('useAnalysisQueue must be used within AnalysisQueueProvider')
  return ctx
}

export function AnalysisQueueProvider({ children }) {
  const [queue, setQueue] = useState([])
  const [currentGame, setCurrentGame] = useState(null)
  const [currentMove, setCurrentMove] = useState(0)
  const [totalMoves, setTotalMoves] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalQueued, setTotalQueued] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const pausedRef = useRef(false)
  const abortRef = useRef(null)
  const processingRef = useRef(false)
  const queueRef = useRef([])
  // Track game IDs we've already queued or completed to avoid duplicates
  const seenIdsRef = useRef(new Set())

  const processNext = useCallback(async () => {
    if (processingRef.current) return
    if (pausedRef.current) return

    const next = queueRef.current[0]
    if (!next) {
      setIsProcessing(false)
      setCurrentGame(null)
      return
    }

    processingRef.current = true
    setIsProcessing(true)
    setCurrentGame(next)
    setCurrentMove(0)
    setTotalMoves(0)
    setError(null)

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const result = await analyzeFullGame(next.pgn, {
        onProgress: (moveIdx, total) => {
          setCurrentMove(moveIdx)
          setTotalMoves(total)
        },
        signal: abortController.signal,
      })

      await saveGameAnalysis(next.game_id, {
        analysed_game: { moves: result.moves, summary: result.summary },
        white_accuracy: result.summary.white_accuracy,
        black_accuracy: result.summary.black_accuracy,
        user_blunder_count:
          result.summary.white_blunders + result.summary.black_blunders,
      })

      // Remove from queue, bump completed
      queueRef.current = queueRef.current.slice(1)
      setQueue(queueRef.current)
      setCompletedCount((c) => c + 1)
    } catch (err) {
      if (err.message === 'Analysis cancelled') {
        // Cancelled — don't set error, just stop
        processingRef.current = false
        return
      }
      console.error('Analysis failed for game', next.game_id, err)
      setError({ gameId: next.game_id, message: err.message })
      // Skip failed game
      queueRef.current = queueRef.current.slice(1)
      setQueue(queueRef.current)
    } finally {
      abortRef.current = null
      processingRef.current = false
      setCurrentGame(null)
    }

    // Process next in queue
    if (!pausedRef.current && queueRef.current.length > 0) {
      // Use setTimeout to avoid deep recursion
      setTimeout(() => processNext(), 0)
    } else {
      setIsProcessing(false)
    }
  }, [])

  const enqueueGames = useCallback((games) => {
    const newGames = games.filter(
      (g) => !g.is_analysed && !seenIdsRef.current.has(g.game_id)
    )
    if (newGames.length === 0) return

    for (const g of newGames) {
      seenIdsRef.current.add(g.game_id)
    }

    queueRef.current = [...queueRef.current, ...newGames]
    setQueue(queueRef.current)
    setTotalQueued((t) => t + newGames.length)

    if (!processingRef.current && !pausedRef.current) {
      processNext()
    }
  }, [processNext])

  const pauseQueue = useCallback(() => {
    pausedRef.current = true
    if (abortRef.current) abortRef.current.abort()
    setIsProcessing(false)
  }, [])

  const resumeQueue = useCallback(() => {
    pausedRef.current = false
    if (queueRef.current.length > 0 && !processingRef.current) {
      processNext()
    }
  }, [processNext])

  const cancelQueue = useCallback(() => {
    pausedRef.current = false
    if (abortRef.current) abortRef.current.abort()
    queueRef.current = []
    seenIdsRef.current.clear()
    setQueue([])
    setCurrentGame(null)
    setIsProcessing(false)
    setCompletedCount(0)
    setTotalQueued(0)
    setError(null)
  }, [])

  return (
    <AnalysisQueueContext.Provider
      value={{
        queue,
        currentGame,
        currentMove,
        totalMoves,
        completedCount,
        totalQueued,
        isProcessing,
        error,
        enqueueGames,
        pauseQueue,
        resumeQueue,
        cancelQueue,
      }}
    >
      {children}
    </AnalysisQueueContext.Provider>
  )
}
