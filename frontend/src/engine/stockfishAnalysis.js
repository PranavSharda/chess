/**
 * Run Stockfish in the browser via Web Worker (UCI).
 * Returns the same shape as the old backend API: { evaluation, best_move, top_lines }.
 */

const STOCKFISH_URL = '/stockfish/stockfish-18-lite-single.js'
const DEPTH = 18
const MULTI_PV = 3

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

/**
 * Analyze a position (FEN) and return { evaluation, best_move, top_lines }.
 * Matches the shape previously returned by the backend.
 */
export function analyzePosition(fen) {
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
          worker.postMessage(`setoption name MultiPV value ${MULTI_PV}`)
          worker.postMessage(`go depth ${DEPTH}`)
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

          const topLines = [1, 2, 3]
            .map((i) => multipvLines[i])
            .filter(Boolean)

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

