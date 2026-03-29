import { Chess } from 'chess.js'
import { createAnalysisPool } from './stockfishAnalysis'

const BATCH_DEPTH = 12
const POOL_SIZE = Math.min(navigator.hardwareConcurrency || 4, 6)

const CLASSIFICATION_THRESHOLDS = [
  { max: 0, label: 'best' },
  { max: 20, label: 'good' },
  { max: 50, label: 'inaccuracy' },
  { max: 100, label: 'mistake' },
  { max: Infinity, label: 'blunder' },
]

function classifyMove(cpLoss) {
  for (const { max, label } of CLASSIFICATION_THRESHOLDS) {
    if (cpLoss <= max) return label
  }
  return 'blunder'
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

/**
 * Analyze an entire game from PGN using parallel workers.
 *
 * @param {string} pgn - PGN string of the game
 * @param {object} options
 * @param {function} options.onProgress - Called with (completed, totalPositions) after each position
 * @param {AbortSignal} options.signal - AbortSignal to cancel analysis
 * @returns {Promise<{ moves: Array, summary: object }>}
 */
export async function analyzeFullGame(pgn, { onProgress, signal } = {}) {
  const chess = new Chess()
  chess.loadPgn(pgn)
  const moves = chess.history({ verbose: true })

  // Build list of FENs: starting position + position after each move
  const fens = [new Chess().fen()]
  const replay = new Chess()
  for (const move of moves) {
    replay.move(move)
    fens.push(replay.fen())
  }

  const pool = await createAnalysisPool(POOL_SIZE)

  try {
    // Analyze all positions in parallel across workers
    const evals = await pool.analyzeAll(fens, {
      onProgress,
      signal,
      depth: BATCH_DEPTH,
    })

    // Build move-by-move analysis
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

      const classification = classifyMove(cpLoss)

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
    }
  } finally {
    pool.destroy()
  }
}
