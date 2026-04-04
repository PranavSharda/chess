import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import ErrorBanner from '../components/ui/ErrorBanner'
import useBoardSize from '../hooks/useBoardSize'
import { getPuzzle } from '../services/puzzles'
import { playMoveSound, playPuzzleSound } from '../utils/sounds'
import './PuzzleSolver.css'

function parseUciMove(uci) {
  if (!uci || uci.length < 4) return null
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci[4],
  }
}

function applyUciMove(chess, uci) {
  const move = parseUciMove(uci)
  if (!move) return null
  return chess.move(move)
}

function buildSolverSetup(puzzle) {
  const line = Array.isArray(puzzle?.solution_uci) ? puzzle.solution_uci : []
  if (!puzzle?.start_fen || line.length < 2) return null

  try {
    const chess = new Chess(puzzle.start_fen)
    const preMoveFen = chess.fen()
    // The solver plays as the side whose turn it is AFTER the opponent's move
    const opponentColor = chess.turn() // opponent moves first
    const solverColor = opponentColor === 'w' ? 'black' : 'white'
    if (!applyUciMove(chess, line[0])) return null
    return {
      preMoveFen,
      postMoveFen: chess.fen(),
      opponentUci: line[0],
      orientation: solverColor,
      solveLine: line.slice(1),
    }
  } catch {
    return null
  }
}

function getPromotion(moveFrom, moveTo, piece) {
  if (piece !== 'wP' && piece !== 'bP') return undefined
  if (!moveFrom || !moveTo) return undefined
  if (!moveTo.endsWith('1') && !moveTo.endsWith('8')) return undefined
  return 'q'
}

function PuzzleSolver() {
  const { puzzleId } = useParams()
  const navigate = useNavigate()
  const boardWrapperRef = useRef(null)
  const boardSize = useBoardSize(boardWrapperRef)
  const [puzzle, setPuzzle] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [position, setPosition] = useState('start')
  const [nextIndex, setNextIndex] = useState(0)
  const [history, setHistory] = useState([]) // [{ fen, nextIndex }]
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('') // 'correct' | 'wrong' | 'solved' | ''
  const [isSolved, setIsSolved] = useState(false)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [moveHighlight, setMoveHighlight] = useState(null) // { from, to, type: 'correct'|'wrong' }
  const [isPlayingSolution, setIsPlayingSolution] = useState(false)
  const solutionTimerRef = useRef(null)

  useEffect(() => {
    if (!puzzleId) {
      setError('No puzzle selected')
      setIsLoading(false)
      return
    }

    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await getPuzzle(puzzleId)
        if (!cancelled) setPuzzle(data)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || err.message || 'Failed to load puzzle')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [puzzleId])

  const solutionKey = Array.isArray(puzzle?.solution_uci) ? puzzle.solution_uci.join(' ') : ''
  const solverSetup = useMemo(
    () => buildSolverSetup(puzzle),
    [puzzle?.start_fen, solutionKey]
  )
  const tags = puzzle?.normalized_tags?.length ? puzzle.normalized_tags : (puzzle?.raw_tags || [])

  const [waitingForOpponent, setWaitingForOpponent] = useState(false)

  const animateOpponentMove = useCallback(() => {
    if (!solverSetup || !puzzle) return
    setWaitingForOpponent(true)
    setPosition(solverSetup.preMoveFen)
    setNextIndex(0)
    setIsSolved(false)
    setSelectedSquare(null)
    setMoveHighlight(null)
    setFeedbackType('')
    setFeedback('')

    // Animate the opponent's blunder after a short pause
    const timer = setTimeout(() => {
      setPosition(solverSetup.postMoveFen)
      const parsed = parseUciMove(solverSetup.opponentUci)
      if (parsed) {
        // Highlight the opponent's move briefly
        setMoveHighlight({ from: parsed.from, to: parsed.to, type: 'wrong' })
        setTimeout(() => setMoveHighlight(null), 800)
      }
      playMoveSound({ san: puzzle.played_move })
      setFeedback(`Your opponent played ${puzzle.played_move}. Find the best response.`)
      setWaitingForOpponent(false)
    }, 600)

    return timer
  }, [solverSetup, puzzle])

  useEffect(() => {
    if (!solverSetup || !puzzle) {
      setPosition('start')
      setNextIndex(0)
      setIsSolved(false)
      setFeedback('This puzzle does not have a playable solution line yet.')
      setFeedbackType('')
      return
    }

    const timer = animateOpponentMove()
    return () => clearTimeout(timer)
  }, [solverSetup, puzzle?.puzzle_id])

  const handleReset = () => {
    if (!solverSetup || !puzzle) return
    if (solutionTimerRef.current) clearTimeout(solutionTimerRef.current)
    setIsPlayingSolution(false)
    setHistory([])
    animateOpponentMove()
  }

  const handleBack = () => {
    if (!solverSetup || history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setPosition(prev.fen)
    setNextIndex(prev.nextIndex)
    setIsSolved(false)
    setSelectedSquare(null)
    setMoveHighlight(null)
    setFeedback('Move undone. Try again.')
    setFeedbackType('')
  }

  const handleShowSolution = useCallback(() => {
    if (!solverSetup || isSolved || isPlayingSolution) return

    setIsPlayingSolution(true)
    setSelectedSquare(null)
    setFeedback('Playing solution...')
    setFeedbackType('')

    // Build all remaining FENs from current position
    const chess = new Chess(position)
    const steps = []
    for (let i = nextIndex; i < solverSetup.solveLine.length; i++) {
      const uci = solverSetup.solveLine[i]
      const move = applyUciMove(chess, uci)
      if (!move) break
      const parsed = parseUciMove(uci)
      steps.push({ fen: chess.fen(), from: parsed?.from, to: parsed?.to })
    }

    // Save current state for undo
    setHistory((prev) => [...prev, { fen: position, nextIndex }])

    let stepIdx = 0
    const playNext = () => {
      if (stepIdx >= steps.length) {
        setIsSolved(true)
        setIsPlayingSolution(false)
        setFeedback('Solution shown. Reset to try again.')
        setFeedbackType('solved')
        setNextIndex(solverSetup.solveLine.length)
        playPuzzleSound('puzzleSolved')
        return
      }

      const step = steps[stepIdx]
      setPosition(step.fen)
      if (step.from && step.to) {
        setMoveHighlight({ from: step.from, to: step.to, type: 'correct' })
      }
      playMoveSound({ san: '' })
      stepIdx++
      solutionTimerRef.current = setTimeout(playNext, 700)
    }

    solutionTimerRef.current = setTimeout(playNext, 100)
  }, [solverSetup, isSolved, isPlayingSolution, position, nextIndex])

  // Clean up solution playback on unmount
  useEffect(() => {
    return () => {
      if (solutionTimerRef.current) clearTimeout(solutionTimerRef.current)
    }
  }, [])

  const flashHighlight = useCallback((from, to, type) => {
    setMoveHighlight({ from, to, type })
    setTimeout(() => setMoveHighlight(null), type === 'wrong' ? 600 : 1500)
  }, [])

  const tryMove = useCallback((from, to, promotion) => {
    if (!solverSetup || isSolved || waitingForOpponent) return false

    const expectedMove = solverSetup.solveLine[nextIndex]
    const attemptedMove = `${from}${to}${promotion || ''}`

    if (attemptedMove !== expectedMove) {
      setFeedback('Not quite. Try again and look for the strongest tactical move.')
      setFeedbackType('wrong')
      setSelectedSquare(null)
      flashHighlight(from, to, 'wrong')
      playPuzzleSound('puzzleWrong')
      return false
    }

    const chess = new Chess(position)
    const move = chess.move({ from, to, promotion })
    if (!move) return false

    playMoveSound(move)

    // Save current state for undo
    setHistory((prev) => [...prev, { fen: position, nextIndex }])

    let updatedIndex = nextIndex + 1
    if (updatedIndex < solverSetup.solveLine.length) {
      applyUciMove(chess, solverSetup.solveLine[updatedIndex])
      updatedIndex += 1
    }

    setPosition(chess.fen())
    setNextIndex(updatedIndex)
    setSelectedSquare(null)
    flashHighlight(from, to, 'correct')

    if (updatedIndex >= solverSetup.solveLine.length) {
      setIsSolved(true)
      setFeedback('Solved. Nice find.')
      setFeedbackType('solved')
      setTimeout(() => playPuzzleSound('puzzleSolved'), 300)
    } else {
      setFeedback('Correct. Find the next move.')
      setFeedbackType('correct')
      playPuzzleSound('puzzleCorrect')
    }

    return true
  }, [solverSetup, isSolved, waitingForOpponent, nextIndex, position, flashHighlight])

  const handleDrop = (sourceSquare, targetSquare, piece) => {
    const promotion = getPromotion(sourceSquare, targetSquare, piece)
    return tryMove(sourceSquare, targetSquare, promotion)
  }

  const onSquareClick = useCallback((square, piece) => {
    if (!solverSetup || isSolved || waitingForOpponent) return

    const chess = new Chess(position)
    const turn = chess.turn()

    if (!selectedSquare) {
      // First click — select a piece of the correct color
      if (piece && typeof piece === 'string') {
        const pieceColor = piece.startsWith('w') ? 'w' : 'b'
        if (pieceColor === turn) setSelectedSquare(square)
      }
      return
    }

    // Second click — try to move to target square
    const moves = chess.moves({ square: selectedSquare, verbose: true })
    const targetMove = moves.find((m) => m.to === square)
    if (targetMove) {
      const promotion = getPromotion(selectedSquare, square, `${turn === 'w' ? 'w' : 'b'}P`)
      tryMove(selectedSquare, square, promotion)
    } else {
      // Clicked a different own piece — reselect it
      if (piece && typeof piece === 'string') {
        const pieceColor = piece.startsWith('w') ? 'w' : 'b'
        setSelectedSquare(pieceColor === turn ? square : null)
      } else {
        setSelectedSquare(null)
      }
    }
  }, [solverSetup, isSolved, waitingForOpponent, position, selectedSquare, tryMove])

  const onPieceClick = useCallback((piece, square) => {
    if (!solverSetup || isSolved || waitingForOpponent) return
    const chess = new Chess(position)
    const turn = chess.turn()
    const pieceColor = piece.startsWith('w') ? 'w' : 'b'

    if (pieceColor !== turn) {
      // Clicked opponent piece — if we had a piece selected, try to capture
      if (selectedSquare) {
        const moves = chess.moves({ square: selectedSquare, verbose: true })
        const targetMove = moves.find((m) => m.to === square)
        if (targetMove) {
          const promotion = getPromotion(selectedSquare, square, `${turn === 'w' ? 'w' : 'b'}P`)
          tryMove(selectedSquare, square, promotion)
          return
        }
      }
      setSelectedSquare(null)
      return
    }

    setSelectedSquare((prev) => (prev === square ? null : square))
  }, [solverSetup, isSolved, waitingForOpponent, position, selectedSquare, tryMove])

  const customSquareStyles = useMemo(() => {
    const styles = {}

    // Move result highlight (correct = green, wrong = red)
    if (moveHighlight) {
      const color = moveHighlight.type === 'correct'
        ? 'rgba(78, 205, 142, 0.5)'
        : 'rgba(235, 77, 75, 0.5)'
      styles[moveHighlight.from] = { background: color }
      styles[moveHighlight.to] = { background: color }
    }

    // Legal move dots for selected piece
    if (selectedSquare && solverSetup && !isSolved && !moveHighlight) {
      try {
        const chess = new Chess(position)
        const moves = chess.moves({ square: selectedSquare, verbose: true })
        if (Array.isArray(moves) && moves.length) {
          styles[selectedSquare] = { background: 'rgba(255, 255, 0, 0.4)' }
          moves.forEach((m) => {
            const isCapture = chess.get && chess.get(m.to)
            styles[m.to] = isCapture
              ? { background: 'radial-gradient(transparent 51%, rgba(0, 0, 0, 0.3) 51%)', borderRadius: '50%' }
              : { background: 'radial-gradient(rgba(0, 0, 0, 0.25) 25%, transparent 25%)', borderRadius: '50%' }
          })
        }
      } catch {
        // ignore
      }
    }

    return styles
  }, [selectedSquare, position, solverSetup, isSolved, moveHighlight])

  const onPieceDragBegin = useCallback((_piece, sourceSquare) => {
    setSelectedSquare(sourceSquare)
  }, [])

  if (isLoading) {
    return (
      <div className="puzzle-solver-page puzzle-solver-loading">
        <Spinner size="lg" />
        <p>Loading puzzle...</p>
      </div>
    )
  }

  if (error || !puzzle) {
    return (
      <div className="puzzle-solver-page">
        <div className="puzzle-solver-header">
          <Button variant="secondary" onClick={() => navigate('/puzzles')}>Back to Puzzles</Button>
        </div>
        <ErrorBanner message={error || 'Puzzle not found'} />
      </div>
    )
  }

  const canSolve = !!solverSetup
  const canInteract = canSolve && !isSolved && !waitingForOpponent

  return (
    <div className="puzzle-solver-page">
      <div className="puzzle-solver-header">
        <div>
          <h1 className="page-title">Solve Puzzle</h1>
          <p className="page-subtitle">Play out the tactical continuation from your own game.</p>
        </div>
        <div className="puzzle-solver-header-actions">
          <Button variant="secondary" onClick={() => navigate('/puzzles')}>Back to Puzzles</Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/games/${puzzle.game_id}?move=${Math.max(0, puzzle.source_half_move_index)}`)}
          >
            Open Game
          </Button>
        </div>
      </div>

      <div className="puzzle-solver-layout">
        <Card className="puzzle-play-card">
          <div className="puzzle-play-header">
            <div>
              <div className="puzzle-play-title">Puzzle Board</div>
              <div className="puzzle-play-subtitle">
                {canSolve ? `Your opponent played ${puzzle.played_move}. Find the best response.` : 'Solver unavailable'}
              </div>
            </div>
            <div className="puzzle-play-header-right">
              {canSolve && (
                <div className="puzzle-turn-indicator">
                  <span className={`puzzle-turn-dot ${solverSetup.orientation === 'white' ? 'is-white' : 'is-black'}`} />
                  <span>{solverSetup.orientation === 'white' ? 'White' : 'Black'} to move</span>
                </div>
              )}
              <Badge variant={isSolved ? 'win' : 'info'}>{isSolved ? 'Solved' : 'In Progress'}</Badge>
            </div>
          </div>

          <div className="puzzle-board-shell" ref={boardWrapperRef}>
            <Chessboard
              position={position}
              onPieceDrop={handleDrop}
              onSquareClick={onSquareClick}
              onPieceClick={onPieceClick}
              onPieceDragBegin={onPieceDragBegin}
              arePiecesDraggable={canInteract && !isPlayingSolution}
              animationDuration={300}
              boardWidth={boardSize}
              boardOrientation={solverSetup?.orientation || 'white'}
              customBoardStyle={{ borderRadius: '8px' }}
              customDarkSquareStyle={{ backgroundColor: '#779952' }}
              customLightSquareStyle={{ backgroundColor: '#edeed1' }}
              customSquareStyles={customSquareStyles}
            />
          </div>

          <div className={`puzzle-feedback${feedbackType === 'correct' ? ' is-correct' : ''}${feedbackType === 'wrong' ? ' is-wrong' : ''}${feedbackType === 'solved' ? ' is-solved' : ''}`}>
            {feedback}
          </div>

          <div className="puzzle-play-actions">
            <Button variant="secondary" onClick={handleBack} disabled={history.length === 0 || isPlayingSolution}>Back</Button>
            <Button variant="secondary" onClick={handleReset} disabled={!canSolve || isPlayingSolution}>Reset</Button>
            <Button variant="secondary" onClick={handleShowSolution} disabled={!canSolve || isSolved || isPlayingSolution}>Show Solution</Button>
          </div>
        </Card>

        <div className="puzzle-info-column">
          {tags.length > 0 && (
            <Card>
              <div className="puzzle-info-title">Themes</div>
              <div className="puzzle-theme-list">
                {tags.map((tag) => (
                  <Badge key={tag} variant="info">{tag}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <div className="puzzle-info-title">Tips</div>
            <div className="puzzle-tip-list">
              <div className="puzzle-tip">Your opponent just made a mistake. Find the best way to punish it.</div>
              <div className="puzzle-tip">Focus on checks, captures, and forcing moves first.</div>
              <div className="puzzle-tip">Use Show Next Move if you're stuck, or Reset to try again.</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PuzzleSolver
