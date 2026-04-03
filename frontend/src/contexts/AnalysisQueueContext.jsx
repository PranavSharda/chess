import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { analyzeFullGame, WORKER_COUNT } from '../engine/analyzeFullGame'
import { saveGameAnalysis } from '../services/games'

const AnalysisQueueContext = createContext(null)

export function useAnalysisQueue() {
  const ctx = useContext(AnalysisQueueContext)
  if (!ctx) throw new Error('useAnalysisQueue must be used within AnalysisQueueProvider')
  return ctx
}

export function AnalysisQueueProvider({ children }) {
  const [completedCount, setCompletedCount] = useState(0)
  const [totalQueued, setTotalQueued] = useState(0)
  const [activeWorkers, setActiveWorkers] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const pausedRef = useRef(false)
  const abortRef = useRef(null)
  const runningRef = useRef(0)
  const queueRef = useRef([])
  const seenIdsRef = useRef(new Set())
  const activeSessionsRef = useRef(new Set())
  const processingRef = useRef(false)

  const processQueue = useCallback(async () => {
    if (pausedRef.current) return

    const abortController = new AbortController()
    abortRef.current = abortController

    const workerCount = Math.min(WORKER_COUNT, queueRef.current.length)
    console.log(`[Queue] Starting ${workerCount} workers for ${queueRef.current.length} games (${navigator.hardwareConcurrency} cores)`)

    setIsProcessing(true)

    async function runWorker(workerId) {
      while (queueRef.current.length > 0) {
        if (pausedRef.current || abortController.signal.aborted) return

        const game = queueRef.current.shift()
        if (!game) return

        runningRef.current++
        setActiveWorkers(runningRef.current)

        const startTime = performance.now()

        try {
          console.log(`[Queue] Worker ${workerId} → game ${game.game_id}`)

          const result = await analyzeFullGame(game.pgn, {
            signal: abortController.signal,
            gameId: game.game_id,
            workerId,
            onSession: (session) => activeSessionsRef.current.add(session),
          })

          const totalMs = result.timings?.totalMs ?? (performance.now() - startTime)
          const elapsed = (totalMs / 1000).toFixed(1)
          const numMoves = result.moves.length
          const perMove = result.timings?.msPerMove != null
            ? (result.timings.msPerMove / 1000).toFixed(2)
            : numMoves > 0
              ? (totalMs / 1000 / numMoves).toFixed(2)
              : '?'
          const timingBreakdown = result.timings
            ? `load ${result.timings.loadPgnMs}ms, fen ${result.timings.buildFenMs}ms, engine ${result.timings.engineMs}ms, post ${result.timings.postProcessMs}ms`
            : 'timing breakdown unavailable'
          console.log(
            `[Analysis] Worker ${workerId} finished game ${game.game_id} — ${numMoves} moves in ${elapsed}s (${perMove}s/move; ${timingBreakdown})`
          )

          await saveGameAnalysis(game.game_id, {
            analysed_game: { moves: result.moves, summary: result.summary },
            white_accuracy: result.summary.white_accuracy,
            black_accuracy: result.summary.black_accuracy,
            user_blunder_count:
              result.summary.white_blunders + result.summary.black_blunders,
          })

          setCompletedCount((c) => c + 1)
        } catch (err) {
          if (err.message === 'Analysis cancelled' || err.message === 'Session destroyed') return

          const isSkip = err.message?.includes('skipping')
          if (isSkip) {
            console.warn(`[Queue] Worker ${workerId} skipped game ${game.game_id}: ${err.message}`)
          } else {
            console.error(`[Queue] Worker ${workerId} failed game ${game.game_id}:`, err)
            setError({ gameId: game.game_id, message: err.message })
          }
          setCompletedCount((c) => c + 1)
        } finally {
          runningRef.current--
          setActiveWorkers(runningRef.current)
        }
      }
    }

    await Promise.all(
      Array.from({ length: workerCount }, (_, i) => runWorker(i))
    )

    abortRef.current = null
    setIsProcessing(false)
    setActiveWorkers(0)
    console.log('[Queue] All workers finished')
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
    setTotalQueued((t) => t + newGames.length)

    if (!isProcessing && !pausedRef.current) {
      processQueue()
    }
  }, [isProcessing, processQueue])

  const pauseQueue = useCallback(() => {
    pausedRef.current = true
    if (abortRef.current) abortRef.current.abort()
    // Kill active Stockfish workers so they don't hang
    for (const session of activeSessionsRef.current) {
      try { session.destroy() } catch (_) {}
    }
    activeSessionsRef.current.clear()
    setIsProcessing(false)
  }, [])

  const resumeQueue = useCallback(() => {
    pausedRef.current = false
    if (queueRef.current.length > 0) {
      processQueue()
    }
  }, [processQueue])

  const cancelQueue = useCallback(() => {
    pausedRef.current = false
    if (abortRef.current) abortRef.current.abort()
    // Kill all active Stockfish workers immediately
    for (const session of activeSessionsRef.current) {
      try { session.destroy() } catch (_) {}
    }
    activeSessionsRef.current.clear()
    queueRef.current = []
    seenIdsRef.current.clear()
    runningRef.current = 0
    setIsProcessing(false)
    setCompletedCount(0)
    setTotalQueued(0)
    setActiveWorkers(0)
    setError(null)
    console.log('[Queue] Cancelled — all workers terminated')
  }, [])

  return (
    <AnalysisQueueContext.Provider
      value={{
        completedCount,
        totalQueued,
        activeWorkers,
        isProcessing,
        error,
        queueLength: queueRef.current.length,
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
