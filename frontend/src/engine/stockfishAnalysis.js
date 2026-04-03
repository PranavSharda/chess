/**
 * Run Stockfish in the browser via Web Worker (UCI).
 * Returns the same shape as the old backend API: { evaluation, best_move, top_lines }.
 */

const STOCKFISH_URL = '/stockfish/stockfish-18-lite-single.js'
const DEPTH = 18
const DEFAULT_MULTI_PV = 3

function createWorker() {
  return new Worker(STOCKFISH_URL, { type: 'classic' })
}

/**
 * Parse UCI "info" line for score and pv.
 * e.g. "info depth 18 multipv 1 score cp 25 nodes 123 pv e2e4 e7e5"
 * or "info ... score mate 3 pv ..."
 */
function parseInfoLine(line, sideToMove) {
  const scoreMatch = line.match(/score (cp|mate) (-?\d+)/)
  if (!scoreMatch) return null
  const [, kind, valueStr] = scoreMatch
  const value = parseInt(valueStr, 10)
  const pvMatch = line.match(/ pv ([^\n]+)/)
  const pv = pvMatch ? pvMatch[1].trim() : ''

  // UCI score is from side-to-move perspective; convert to white's perspective for UI
  const whitePerspective = sideToMove === 'w' ? 1 : -1
  const cp = kind === 'mate' ? null : value * whitePerspective
  const mate = kind === 'mate' ? value * whitePerspective : null

  return {
    Centipawn: cp !== null ? cp : undefined,
    Mate: mate !== null ? mate : undefined,
    Line: pv,
  }
}

/**
 * Parse "bestmove e2e4 ponder e7e5"
 */
function parseBestMove(line) {
  const m = line.match(/^bestmove (\S+)/)
  return m ? m[1] : null
}

function getTopLines(multipvLines, multiPv) {
  return Array.from({ length: multiPv }, (_, idx) => multipvLines[idx + 1]).filter(Boolean)
}

/**
 * Analyze a position (FEN) and return { evaluation, best_move, top_lines }.
 * Matches the shape previously returned by the backend.
 */
/**
 * Create a persistent analysis session that reuses a single worker.
 * Usage:
 *   const session = await createAnalysisSession()
 *   const result = await session.analyze(fen)
 *   session.destroy()
 */
export function createAnalysisSession({ multiPv = DEFAULT_MULTI_PV } = {}) {
  const worker = createWorker()
  let ready = false
  let destroyed = false
  let pending = null // { resolve, reject, multipvLines, sideToMove, timeout }

  const readyPromise = new Promise((resolve, reject) => {
    const initTimeout = setTimeout(() => {
      worker.terminate()
      reject(new Error('Stockfish init timed out'))
    }, 30000)

    worker.onmessage = (e) => {
      const raw = typeof e.data === 'string' ? e.data : e.data?.data ?? ''
      const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean)

      for (const line of lines) {
        if (!line) continue

        if (line === 'uciok' && !ready) {
          ready = true
          clearTimeout(initTimeout)
          worker.postMessage(`setoption name MultiPV value ${multiPv}`)
          worker.postMessage('isready')
          continue
        }

        if (line === 'readyok' && !pending) {
          resolve()
          continue
        }

        if (line === 'readyok' && pending) {
          continue
        }

        if (pending && line.startsWith('info ') && line.includes(' multipv ')) {
          const parsed = parseInfoLine(line, pending.sideToMove)
          if (parsed) {
            const multipvMatch = line.match(/ multipv (\d+)/)
            const idx = multipvMatch ? parseInt(multipvMatch[1], 10) : 1
            pending.multipvLines[idx] = parsed
          }
          continue
        }

        if (pending && line.startsWith('bestmove ')) {
          const bestMove = parseBestMove(line)
          clearTimeout(pending.timeout)

          const topLines = getTopLines(pending.multipvLines, multiPv)

          const first = topLines[0]
          const evaluation = first
            ? {
                type: first.Mate !== undefined && first.Mate !== null ? 'mate' : 'cp',
                value:
                  first.Mate !== undefined && first.Mate !== null
                    ? first.Mate
                    : first.Centipawn ?? 0,
              }
            : { type: 'cp', value: 0 }

          const p = pending
          pending = null
          p.resolve({ evaluation, best_move: bestMove ?? '', top_lines: topLines })
        }
      }
    }

    worker.onerror = (err) => {
      if (pending) {
        clearTimeout(pending.timeout)
        const p = pending
        pending = null
        p.reject(err)
      }
    }

    worker.postMessage('uci')
  })

  return readyPromise.then(() => ({
    analyze(fen, depth) {
      if (destroyed) return Promise.reject(new Error('Session destroyed'))
      const d = depth || DEPTH

      return new Promise((resolve, reject) => {
        const sideToMove = fen.includes(' w ') ? 'w' : 'b'
        const timeout = setTimeout(() => {
          if (pending) {
            const p = pending
            pending = null
            p.reject(new Error('Stockfish analysis timed out'))
          }
        }, 60000)

        pending = { resolve, reject, multipvLines: {}, sideToMove, timeout }
        worker.postMessage('position fen ' + fen)
        worker.postMessage(`go depth ${d}`)
      })
    },

    destroy() {
      destroyed = true
      if (pending) {
        clearTimeout(pending.timeout)
        pending.reject(new Error('Session destroyed'))
        pending = null
      }
      worker.terminate()
    },
  }))
}

/**
 * Create a pool of N persistent analysis sessions for parallel analysis.
 * Usage:
 *   const pool = await createAnalysisPool(4)
 *   const results = await pool.analyzeAll([fen1, fen2, ...], onProgress)
 *   pool.destroy()
 */
export async function createAnalysisPool(size) {
  const count = size || Math.min(navigator.hardwareConcurrency || 4, 6)
  console.log(`[Pool] Spawning ${count} workers (${navigator.hardwareConcurrency} cores available)`)
  const sessions = await Promise.all(
    Array.from({ length: count }, () => createAnalysisSession())
  )
  let destroyed = false

  return {
    async analyzeAll(fens, { onProgress, signal, depth = DEPTH, label = '' } = {}) {
      if (destroyed) throw new Error('Pool destroyed')

      const results = new Array(fens.length)
      let nextIdx = 0
      let completed = 0

      async function runWorker(session, workerId) {
        while (nextIdx < fens.length) {
          if (signal?.aborted) throw new Error('Analysis cancelled')
          const idx = nextIdx++
          console.log(`[Pool] Worker ${workerId} → position ${idx + 1}/${fens.length}${label ? ` (${label})` : ''}`)
          results[idx] = await session.analyze(fens[idx], depth)
          completed++
          if (onProgress) onProgress(completed, fens.length)
        }
      }

      await Promise.all(sessions.map((s, i) => runWorker(s, i)))
      return results
    },

    destroy() {
      destroyed = true
      sessions.forEach((s) => s.destroy())
    },
  }
}

export function analyzePosition(fen, { multiPv = DEFAULT_MULTI_PV, depth = DEPTH } = {}) {
  const worker = createWorker()
  const sideToMove = fen.includes(' w ') ? 'w' : 'b'

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate()
      reject(new Error('Stockfish analysis timed out'))
    }, 60000)

    const multipvLines = {}
    let bestMove = null
    let resolved = false

    worker.onmessage = (e) => {
      const raw = typeof e.data === 'string' ? e.data : e.data?.data ?? ''
      const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean)
      for (const line of lines) {
        if (!line) continue

        if (line === 'uciok') {
          worker.postMessage('ucinewgame')
          worker.postMessage(`position fen ${fen}`)
          worker.postMessage(`setoption name MultiPV value ${multiPv}`)
          worker.postMessage(`go depth ${depth}`)
          break
        }

        if (line.startsWith('info ') && line.includes(' multipv ')) {
          const parsed = parseInfoLine(line, sideToMove)
          if (parsed) {
            const multipvMatch = line.match(/ multipv (\d+)/)
            const idx = multipvMatch ? parseInt(multipvMatch[1], 10) : 1
            multipvLines[idx] = parsed
          }
          continue
        }

        if (line.startsWith('bestmove ')) {
          bestMove = parseBestMove(line)
          clearTimeout(timeout)
          worker.terminate()
          if (resolved) break
          resolved = true

          const topLines = getTopLines(multipvLines, multiPv)

          const first = topLines[0]
          const evaluation = first
            ? {
                type: first.Mate !== undefined && first.Mate !== null ? 'mate' : 'cp',
                value:
                  first.Mate !== undefined && first.Mate !== null
                    ? first.Mate
                    : first.Centipawn ?? 0,
              }
            : { type: 'cp', value: 0 }

          resolve({
            evaluation,
            best_move: bestMove ?? '',
            top_lines: topLines,
          })
          break
        }
      }
    }

    worker.onerror = (err) => {
      clearTimeout(timeout)
      worker.terminate()
      if (!resolved) {
        resolved = true
        reject(err)
      }
    }

    worker.postMessage('uci')
  })
}
