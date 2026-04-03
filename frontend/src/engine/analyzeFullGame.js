import { Chess } from 'chess.js'
import { createAnalysisSession } from './stockfishAnalysis'

export const BATCH_DEPTH = 16
export const WORKER_COUNT = 2
const FULL_GAME_MULTI_PV = 1

// Shared FEN → eval cache across all games in this session
const fenCache = new Map()
let cacheHits = 0
let cacheMisses = 0

// Lichess winning chances: sigmoid mapping cp → [-1, 1]
// Constant from https://github.com/lichess-org/lila/blob/master/modules/analyse/src/main/WinPercent.scala
function cpToWinningChances(cp) {
  return 2 / (1 + Math.exp(-0.00368208 * cp)) - 1
}

function evalToWinningChances(evaluation) {
  if (evaluation.type === 'mate') {
    return evaluation.value > 0 ? 1 : -1
  }
  return cpToWinningChances(evaluation.value)
}

// Lichess thresholds (winning chances delta):
// >= 0.3 → blunder, >= 0.2 → mistake, >= 0.1 → inaccuracy
// Source: https://github.com/lichess-org/lila/blob/master/modules/tree/src/main/Advice.scala
function classifyMove(winChancesLoss) {
  if (winChancesLoss >= 0.3) return 'blunder'
  if (winChancesLoss >= 0.2) return 'mistake'
  if (winChancesLoss >= 0.1) return 'inaccuracy'
  if (winChancesLoss <= 0) return 'best'
  return 'good'
}

function evalToCp(evaluation) {
  if (evaluation.type === 'mate') {
    return evaluation.value > 0 ? 10000 : -10000
  }
  return evaluation.value
}

function moveAccuracy(cpLoss) {
  return Math.max(0, 103.1668 * Math.exp(-0.04354 * Math.abs(cpLoss)) - 3.1668)
}

function nowMs() {
  if (globalThis.performance?.now) return globalThis.performance.now()
  return Date.now()
}

function roundTiming(value, digits = 1) {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/**
 * Analyze an entire game from PGN using a single worker session.
 * For parallelism, run multiple analyzeFullGame calls concurrently (one per worker/game).
 *
 * @param {string} pgn - PGN string of the game
 * @param {object} options
 * @param {function} options.onProgress - Called with (completed, totalPositions) after each position
 * @param {AbortSignal} options.signal - AbortSignal to cancel analysis
 * @param {string} options.gameId - Game ID for logging
 * @param {number} options.workerId - Worker ID for logging
 * @returns {Promise<{ moves: Array, summary: object }>}
 */
export async function analyzeFullGame(pgn, { onProgress, signal, gameId, workerId, onSession } = {}) {
  const totalStart = nowMs()
  const chess = new Chess()
  const loadPgnStart = nowMs()
  try {
    chess.loadPgn(pgn)
  } catch (e) {
    throw new Error(`Unsupported PGN (${e.message}) — skipping`)
  }
  const loadPgnMs = nowMs() - loadPgnStart
  const moves = chess.history({ verbose: true })
  if (moves.length === 0) throw new Error('No moves in PGN — skipping')

  // Build list of FENs: starting position + position after each move
  const buildFenStart = nowMs()
  const fens = [new Chess().fen()]
  const replay = new Chess()
  for (const move of moves) {
    replay.move(move)
    fens.push(replay.fen())
  }
  const buildFenMs = nowMs() - buildFenStart

  const label = workerId != null ? `W${workerId}` : ''
  const session = await createAnalysisSession({ multiPv: FULL_GAME_MULTI_PV })
  if (onSession) onSession(session)

  try {
    const engineStart = nowMs()
    const evals = []
    let gameCacheHits = 0
    let gameCacheMisses = 0

    for (let i = 0; i < fens.length; i++) {
      if (signal?.aborted) throw new Error('Analysis cancelled')

      const cached = fenCache.get(fens[i])
      if (cached) {
        evals.push(cached)
        cacheHits++
        gameCacheHits++
        console.log(`[Cache] ${label} HIT position ${i + 1}/${fens.length} (${gameId || '?'})`)
      } else {
        if (gameId) {
          console.log(`[Pool] ${label} → position ${i + 1}/${fens.length} (${gameId})`)
        }
        const result = await session.analyze(fens[i], BATCH_DEPTH)
        fenCache.set(fens[i], result)
        evals.push(result)
        cacheMisses++
        gameCacheMisses++
      }
      if (onProgress) onProgress(i + 1, fens.length)
    }
    const engineMs = nowMs() - engineStart
    console.log(
      `[Cache] Game ${gameId || '?'} — ${gameCacheHits} hits / ${gameCacheMisses} misses (${fenCache.size} cached positions, ${cacheHits} total hits / ${cacheMisses} total misses)`
    )

    // Build move-by-move analysis
    const postProcessStart = nowMs()
    const analyzedMoves = []
    const whiteAccuracies = []
    const blackAccuracies = []
    let whiteBlunders = 0, blackBlunders = 0
    let whiteMistakes = 0, blackMistakes = 0
    let whiteInaccuracies = 0, blackInaccuracies = 0

    for (let i = 0; i < moves.length; i++) {
      const side = i % 2 === 0 ? 'white' : 'black'
      const moveNumber = Math.floor(i / 2) + 1
      const evalBefore = evals[i]
      const evalAfter = evals[i + 1]

      const cpBefore = evalToCp(evalBefore.evaluation)
      const cpAfter = evalToCp(evalAfter.evaluation)

      // cp_loss from the moving side's perspective
      const cpLoss = side === 'white'
        ? Math.max(0, cpBefore - cpAfter)
        : Math.max(0, cpAfter - cpBefore)

      // Winning chances loss (Lichess method) — perspective-aware
      const wcBefore = evalToWinningChances(evalBefore.evaluation)
      const wcAfter = evalToWinningChances(evalAfter.evaluation)
      const winChancesLoss = side === 'white'
        ? Math.max(0, wcBefore - wcAfter)
        : Math.max(0, wcAfter - wcBefore)

      const classification = classifyMove(winChancesLoss)

      if (side === 'white') {
        whiteAccuracies.push(moveAccuracy(cpLoss))
        if (classification === 'blunder') whiteBlunders++
        if (classification === 'mistake') whiteMistakes++
        if (classification === 'inaccuracy') whiteInaccuracies++
      } else {
        blackAccuracies.push(moveAccuracy(cpLoss))
        if (classification === 'blunder') blackBlunders++
        if (classification === 'mistake') blackMistakes++
        if (classification === 'inaccuracy') blackInaccuracies++
      }

      analyzedMoves.push({
        move_number: moveNumber,
        side,
        san: moves[i].san,
        uci: moves[i].from + moves[i].to + (moves[i].promotion || ''),
        fen_before: fens[i],
        fen_after: fens[i + 1],
        eval_before: evalBefore.evaluation,
        eval_after: evalAfter.evaluation,
        best_move: evalBefore.best_move,
        top_lines: evalBefore.top_lines,
        cp_loss: cpLoss,
        classification,
      })
    }

    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const whiteAccuracy = Math.round(avg(whiteAccuracies) * 10) / 10
    const blackAccuracy = Math.round(avg(blackAccuracies) * 10) / 10
    const postProcessMs = nowMs() - postProcessStart
    const totalMs = nowMs() - totalStart
    const timings = {
      totalMs: roundTiming(totalMs),
      loadPgnMs: roundTiming(loadPgnMs),
      buildFenMs: roundTiming(buildFenMs),
      engineMs: roundTiming(engineMs),
      postProcessMs: roundTiming(postProcessMs),
      moveCount: moves.length,
      positionCount: fens.length,
      msPerMove: roundTiming(totalMs / moves.length),
      msPerPosition: roundTiming(totalMs / fens.length),
      cacheHits: gameCacheHits,
      cacheMisses: gameCacheMisses,
    }

    console.log(
      `[Timing] Game ${gameId || '?'} — total ${timings.totalMs}ms (load ${timings.loadPgnMs}ms, fen ${timings.buildFenMs}ms, engine ${timings.engineMs}ms, post ${timings.postProcessMs}ms, ${timings.msPerMove}ms/move)`
    )

    return {
      moves: analyzedMoves,
      summary: {
        white_accuracy: whiteAccuracy,
        black_accuracy: blackAccuracy,
        white_blunders: whiteBlunders,
        black_blunders: blackBlunders,
        white_mistakes: whiteMistakes,
        black_mistakes: blackMistakes,
        white_inaccuracies: whiteInaccuracies,
        black_inaccuracies: blackInaccuracies,
      },
      timings,
    }
  } finally {
    session.destroy()
  }
}
