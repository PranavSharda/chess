import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'
import { analyzePosition } from '../engine/stockfishAnalysis'
import './AnalyzeGame.css'

const MIN_BOARD = 280
const MAX_BOARD = 760

function AnalyzeGame({ user }) {
  const navigate = useNavigate()
  const boardWrapperRef = useRef(null)
  const [boardSize, setBoardSize] = useState(400)
  const [game, setGame] = useState(null)
  const [chess, setChess] = useState(() => new Chess())
  const [gamePosition, setGamePosition] = useState('start')
  const [moveHistory, setMoveHistory] = useState([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [gameInfo, setGameInfo] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState(null)
  const [pgn, setPgn] = useState('')
  const [topLines, setTopLines] = useState([])
  const [selectedSquare, setSelectedSquare] = useState(null)

  useEffect(() => {
    const el = boardWrapperRef.current
    if (!el) return
    const updateSize = () => {
      const w = el.clientWidth
      const available = w - 44 - 16
      const size = Math.max(MIN_BOARD, Math.min(MAX_BOARD, available))
      setBoardSize(size)
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [game])

  useEffect(() => {
    const gameData = sessionStorage.getItem('analyzeGame')
    if (!gameData) {
      navigate('/analysis')
      return
    }

    try {
      const parsedGame = JSON.parse(gameData)
      setGame(parsedGame)
      
      const isWhite = parsedGame.white?.username?.toLowerCase() === user?.chess_com_username?.toLowerCase()
      const opponent = isWhite ? parsedGame.black : parsedGame.white
      
      setGameInfo({
        white: parsedGame.white,
        black: parsedGame.black,
        isUserWhite: isWhite,
        opponent: opponent,
        timeControl: parsedGame.time_control,
        endTime: parsedGame.end_time,
        result: parsedGame.white?.result || parsedGame.black?.result
      })

      if (parsedGame.pgn) {
        setPgn(parsedGame.pgn)
        loadGameFromPgn(parsedGame.pgn)
      } else {
        setGamePosition('start')
      }
    } catch (err) {
      console.error('Error parsing game data:', err)
      navigate('/analysis')
    }
  }, [user, navigate])

  const loadGameFromPgn = (pgnString) => {
    try {
      const newChess = new Chess()
      newChess.loadPgn(pgnString)
      const moves = newChess.history({ verbose: true })
      setMoveHistory(moves)
      // Start from the beginning
      setCurrentMoveIndex(-1)
      setGamePosition('start')
      // Reset chess to starting position for board interaction
      const resetChess = new Chess()
      setChess(resetChess)
    } catch (err) {
      console.error('Error loading PGN:', err)
    }
  }

  const fenToAnalyze = useMemo(() => {
    if (gamePosition === 'start' || !gamePosition) {
      return new Chess().fen()
    }
    return gamePosition
  }, [gamePosition])

  const analyzeGame = useCallback(async () => {
    if (!fenToAnalyze || !user) return

    setAnalyzing(true)
    setAnalysisError(null)
    try {
      const analysisData = await analyzePosition(fenToAnalyze)
      setAnalysis(analysisData)
      setTopLines(analysisData.top_lines || [])
    } catch (err) {
      console.error('Error analyzing game:', err)
      setAnalysisError(err?.message || 'Engine failed to load')
      setAnalysis(null)
      setTopLines([])
    } finally {
      setAnalyzing(false)
    }
  }, [fenToAnalyze, user])

  useEffect(() => {
    if (!pgn || !game || !user) return
    const t = setTimeout(() => {
      analyzeGame()
    }, 150)
    return () => clearTimeout(t)
  }, [pgn, game, user, fenToAnalyze, analyzeGame])

  const goToMove = useCallback((index) => {
    if (index < -1 || index >= moveHistory.length) return
    
    const tempChess = new Chess()
    
    // Apply moves up to index
    for (let i = 0; i <= index; i++) {
      if (moveHistory[i]) {
        tempChess.move(moveHistory[i])
      }
    }
    
    setCurrentMoveIndex(index)
    setGamePosition(index === -1 ? 'start' : tempChess.fen())
    setChess(tempChess)
    setSelectedSquare(null)
  }, [moveHistory])

  const goToStart = useCallback(() => {
    setCurrentMoveIndex(-1)
    setGamePosition('start')
    setChess(new Chess())
    setSelectedSquare(null)
  }, [])

  const goToEnd = useCallback(() => {
    if (moveHistory.length > 0) {
      goToMove(moveHistory.length - 1)
    }
  }, [moveHistory, goToMove])

  const goToPrevious = useCallback(() => {
    goToMove(currentMoveIndex - 1)
  }, [currentMoveIndex, goToMove])

  const goToNext = useCallback(() => {
    if (currentMoveIndex < moveHistory.length - 1) {
      goToMove(currentMoveIndex + 1)
    }
  }, [currentMoveIndex, moveHistory, goToMove])

  // Current board FEN for display (always a string so dragging works reliably)
  const boardPosition = useMemo(() => {
    if (gamePosition === 'start' || !gamePosition) return new Chess().fen()
    return gamePosition
  }, [gamePosition])

  // True when the board position differs from the game at currentMoveIndex (user explored)
  const isExploringBranch = useMemo(() => {
    if (moveHistory.length === 0) return false
    const gameChess = new Chess()
    for (let i = 0; i <= currentMoveIndex && i < moveHistory.length; i++) {
      if (moveHistory[i]) gameChess.move(moveHistory[i])
    }
    const gameFen = gameChess.fen()
    return boardPosition !== gameFen
  }, [boardPosition, currentMoveIndex, moveHistory])

  const syncToGamePosition = useCallback(() => {
    goToMove(currentMoveIndex)
  }, [currentMoveIndex, goToMove])

  // Legal moves: Chess.com style – light grey translucent circles (dot on empty, halo on capture)
  const customSquareStyles = useMemo(() => {
    try {
      if (!selectedSquare || !chess || typeof chess.game_over !== 'function' || chess.game_over()) return {}
      const moves = chess.moves({ square: selectedSquare, verbose: true })
      if (!Array.isArray(moves) || !moves.length) return {}
      const styles = {
        [selectedSquare]: {
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 65%)',
          borderRadius: '4px',
        },
      }
      moves.forEach((m) => {
        if (!m || !m.to) return
        const isCapture = chess.get && chess.get(m.to)
        styles[m.to] = {
          background: isCapture
            ? 'radial-gradient(circle at center, rgba(200, 200, 200, 0.35) 0%, transparent 50%)'
            : 'radial-gradient(circle at center, rgba(200, 200, 200, 0.3) 0%, transparent 45%)',
          borderRadius: '4px',
        }
      })
      return styles
    } catch {
      return {}
    }
  }, [selectedSquare, boardPosition])

  const onPieceClick = useCallback((piece, square) => {
    try {
      if (!piece || typeof piece !== 'string' || !chess || typeof chess.turn !== 'function') return
      const turn = chess.turn()
      const pieceColor = piece.startsWith('w') ? 'w' : 'b'
      if (pieceColor !== turn) {
        setSelectedSquare(null)
        return
      }
      setSelectedSquare((prev) => (prev === square ? null : square))
    } catch {
      setSelectedSquare(null)
    }
  }, [chess])

  const onSquareClick = useCallback((square, piece) => {
    try {
      if (!chess || typeof chess.turn !== 'function') return
      if (!selectedSquare) {
        if (piece && typeof piece === 'string') {
          const turn = chess.turn()
          const pieceColor = piece.startsWith('w') ? 'w' : 'b'
          if (pieceColor === turn) setSelectedSquare(square)
        }
        return
      }
      const moves = chess.moves({ square: selectedSquare, verbose: true })
      if (!Array.isArray(moves)) return
      const targetMove = moves.find((m) => m && m.to === square)
      if (targetMove) {
        const move = chess.move({ from: selectedSquare, to: square, promotion: 'q' })
        if (move) {
          setGamePosition(chess.fen())
          setSelectedSquare(null)
        }
      } else {
        const turn = chess.turn()
        setSelectedSquare(piece && typeof piece === 'string' && piece.startsWith(turn === 'w' ? 'w' : 'b') ? square : null)
      }
    } catch {
      setSelectedSquare(null)
    }
  }, [selectedSquare, chess])

  // Handle piece drop - allow legal moves from current position (exploration)
  const onDrop = (sourceSquare, targetSquare) => {
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      })

      if (move === null) return false

      setGamePosition(chess.fen())
      setSelectedSquare(null)
      return true
    } catch (error) {
      return false
    }
  }

  const onPieceDragBegin = useCallback((_piece, sourceSquare) => {
    setSelectedSquare(sourceSquare)
  }, [])

  const onPieceDragEnd = useCallback(() => {
    setSelectedSquare(null)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        goToStart()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        goToEnd()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext, goToStart, goToEnd])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getResultText = () => {
    if (!gameInfo) return ''
    if (gameInfo.white?.result === 'win') return '1-0'
    if (gameInfo.black?.result === 'win') return '0-1'
    return '½-½'
  }

  // Group moves into pairs (white, black)
  const movePairs = useMemo(() => {
    const pairs = []
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        whiteIndex: i,
        black: moveHistory[i + 1] || null,
        blackIndex: i + 1
      })
    }
    return pairs
  }, [moveHistory])

  const getCurrentEvaluation = () => {
    return analysis?.evaluation || null
  }

  // Calculate eval bar height (50% = equal, 100% = white winning, 0% = black winning)
  const evalBarHeight = useMemo(() => {
    const currentEval = getCurrentEvaluation()
    if (!currentEval) return 50
    
    const eval_val = currentEval.type === 'cp'
      ? currentEval.value / 100
      : (currentEval.type === 'mate' ? (currentEval.value > 0 ? 10 : -10) : 0)
    // Clamp between -5 and 5 for display purposes
    const clamped = Math.max(-5, Math.min(5, eval_val))
    // Convert to percentage (0-100)
    return 50 + (clamped * 10)
  }, [analysis, currentMoveIndex])

  if (!game || !gameInfo) {
    return (
      <div className="analyze-game-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    )
  }

  const currentEval = getCurrentEvaluation()
  const formatEval = (evalData) => {
    if (!evalData) return '0.0'
    if (evalData.type === 'mate') {
      return evalData.value > 0
        ? `M${Math.abs(evalData.value)}`
        : `-M${Math.abs(evalData.value)}`
    }
    const score = evalData.value / 100
    return `${score >= 0 ? '+' : ''}${score.toFixed(1)}`
  }

  const formatLineEval = (line) => {
    if (line?.Mate !== undefined && line?.Mate !== null) {
      return line.Mate > 0 ? `M${line.Mate}` : `-M${Math.abs(line.Mate)}`
    }
    if (line?.Centipawn !== undefined && line?.Centipawn !== null) {
      const score = line.Centipawn / 100
      return `${score >= 0 ? '+' : ''}${score.toFixed(2)}`
    }
    return '0.00'
  }

  const getLineEvalValue = (line) => {
    if (line?.Mate !== undefined && line?.Mate !== null) {
      return line.Mate > 0 ? 10 : -10
    }
    if (line?.Centipawn !== undefined && line?.Centipawn !== null) {
      return line.Centipawn / 100
    }
    return 0
  }

  return (
    <div className="analyze-game-container">
      <div className="analyze-game-layout">
        {/* Left Panel - Chessboard */}
        <div className="board-section">
          <div className="player-bar opponent">
            <span className="player-name">
              {gameInfo.isUserWhite ? gameInfo.black?.username : gameInfo.white?.username || 'Unknown'}
            </span>
            <span className="player-rating">
              ({gameInfo.isUserWhite ? gameInfo.black?.rating : gameInfo.white?.rating || '?'})
            </span>
          </div>
          
          <div className="chessboard-wrapper" ref={boardWrapperRef}>
            <div className="eval-bar-container">
              <div 
                className={`eval-bar-fill ${evalBarHeight < 50 ? 'black-advantage' : ''}`}
                style={{ height: `${evalBarHeight}%` }}
              />
              <span className="eval-number">
                {formatEval(currentEval)}
              </span>
            </div>
            <Chessboard
              position={boardPosition}
              onPieceDrop={onDrop}
              onPieceClick={onPieceClick}
              onSquareClick={onSquareClick}
              onPieceDragBegin={onPieceDragBegin}
              onPieceDragEnd={onPieceDragEnd}
              arePiecesDraggable={true}
              boardWidth={boardSize}
              boardOrientation={gameInfo.isUserWhite ? 'white' : 'black'}
              customSquareStyles={customSquareStyles}
              customBoardStyle={{
                borderRadius: '4px'
              }}
              customDarkSquareStyle={{ backgroundColor: '#779556' }}
              customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
            />
          </div>
          
          <div className="player-bar user">
            <span className="player-name">
              {gameInfo.isUserWhite ? gameInfo.white?.username : gameInfo.black?.username || 'Unknown'}
            </span>
            <span className="player-rating">
              ({gameInfo.isUserWhite ? gameInfo.white?.rating : gameInfo.black?.rating || '?'})
            </span>
          </div>

          <div className="move-controls">
            <button className="control-btn" onClick={goToStart} title="First move (↑)">
              ⏮
            </button>
            <button className="control-btn" onClick={goToPrevious} title="Previous move (←)">
              ◀
            </button>
            <button className="control-btn play-btn" onClick={goToNext} title="Next move (→)">
              ▶
            </button>
            <button className="control-btn" onClick={goToEnd} title="Last move (↓)">
              ⏭
            </button>
            {isExploringBranch && (
              <button
                type="button"
                className="control-btn sync-to-game-btn"
                onClick={syncToGamePosition}
                title="Back to game position"
              >
                Sync
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Analysis & Moves */}
        <div className="analysis-section">
          <div className="game-header">
            <button className="back-btn" onClick={() => navigate('/analysis')}>
              ← Back
            </button>
            <div className="game-meta">
              <span className="game-date">{formatDate(gameInfo.endTime)}</span>
              <span className="game-result">{getResultText()}</span>
            </div>
          </div>

          {/* Top 3 Lines Panel */}
          <div className="top-lines-panel">
            <div className="lines-header">
              <span className="lines-title">Analysis</span>
              <span className="engine-info">depth=18 | Stockfish</span>
            </div>
            
            {analyzing && topLines.length === 0 && (
              <div className="lines-loading">
                <div className="spinner-small"></div>
                <span>Analyzing...</span>
              </div>
            )}
            
            <div className="lines-list">
              {topLines.map((line, idx) => (
                <div key={idx} className={`line-row ${idx === 0 ? 'best-line' : ''}`}>
                  <span className={`line-eval ${getLineEvalValue(line) > 0 ? 'white-better' : 'black-better'}`}>
                    {formatLineEval(line)}
                  </span>
                  <span className="line-moves">{line.Line || line.line || ''}</span>
                </div>
              ))}
              
              {!analyzing && topLines.length === 0 && !analysisError && (
                <div className="no-lines">
                  {analysis?.evaluation != null ? (
                    <>
                      <span className="line-eval-small">{formatEval(analysis.evaluation)}</span>
                      <span className="no-lines-msg">No alternative lines for this position</span>
                    </>
                  ) : (
                    'No analysis available'
                  )}
                </div>
              )}
              {analysisError && (
                <div className="no-lines analysis-error">{analysisError}</div>
              )}
            </div>
          </div>

          {/* Current Move Info */}
          {currentEval && (
            <div className="current-move-card">
              <span className={`move-eval-badge ${getLineEvalValue({ Centipawn: currentEval.type === 'cp' ? currentEval.value : 0, Mate: currentEval.type === 'mate' ? currentEval.value : null }) > 0 ? 'white-good' : 'black-good'}`}>
                {formatEval(currentEval)}
              </span>
              <span className="current-move-text">
                Best move: {analysis?.best_move || '—'}
              </span>
            </div>
          )}

          {/* Moves Table */}
          <div className="moves-table-container">
            <table className="moves-table">
              <thead>
                <tr>
                  <th className="move-num-col">#</th>
                  <th className="white-col">White</th>
                  <th className="black-col">Black</th>
                </tr>
              </thead>
              <tbody>
                {movePairs.map((pair) => (
                  <tr key={pair.moveNumber}>
                    <td className="move-num">{pair.moveNumber}.</td>
                    <td 
                      className={`move-cell white-move ${currentMoveIndex === pair.whiteIndex ? 'active' : ''}`}
                      onClick={() => goToMove(pair.whiteIndex)}
                    >
                      {pair.white?.san || ''}
                    </td>
                    <td 
                      className={`move-cell black-move ${currentMoveIndex === pair.blackIndex ? 'active' : ''} ${!pair.black ? 'empty' : ''}`}
                      onClick={() => pair.black && goToMove(pair.blackIndex)}
                    >
                      {pair.black?.san || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyzeGame
