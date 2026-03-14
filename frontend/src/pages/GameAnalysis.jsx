import React, { useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useGame from '../hooks/useGame'
import useChessGame from '../hooks/useChessGame'
import useStockfish from '../hooks/useStockfish'
import useBoardSize from '../hooks/useBoardSize'
import useKeyboardNav from '../hooks/useKeyboardNav'
import ChessboardPanel from '../components/chess/ChessboardPanel'
import EngineLines from '../components/chess/EngineLines'
import MoveList from '../components/chess/MoveList'
import MoveControls from '../components/chess/MoveControls'
import Spinner from '../components/ui/Spinner'
import { formatDateShort, getResultText } from '../utils/formatters'
import { getIsWhite } from '../utils/chessHelpers'
import './GameAnalysis.css'

function GameAnalysis() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const boardWrapperRef = useRef(null)

  const { game, isLoading: gameLoading, error: gameError } = useGame(gameId)
  const chessGame = useChessGame()
  const boardSize = useBoardSize(boardWrapperRef)
  const { evaluation, topLines, bestMove, isAnalyzing, error: engineError } = useStockfish(chessGame.position)

  useKeyboardNav({
    onLeft: chessGame.goBack,
    onRight: chessGame.goForward,
    onHome: chessGame.goToStart,
    onEnd: chessGame.goToEnd,
  })

  useEffect(() => {
    if (game?.pgn) chessGame.loadPgn(game.pgn)
  }, [game])

  const isUserWhite = useMemo(() => {
    if (!game || !user) return true
    return getIsWhite(game, user.chess_com_username)
  }, [game, user])

  const topPlayer = isUserWhite ? game?.black : game?.white
  const bottomPlayer = isUserWhite ? game?.white : game?.black

  if (gameLoading) {
    return (
      <div className="game-analysis-loading">
        <Spinner size="lg" />
        <p>Loading game...</p>
      </div>
    )
  }

  if (gameError || !game) {
    return (
      <div className="game-analysis-loading">
        <p>{gameError || 'Game not found'}</p>
        <button onClick={() => navigate('/games')}>Back to Games</button>
      </div>
    )
  }

  const onDrop = (src, tgt) => chessGame.makeMove(src, tgt)

  return (
    <div className="game-analysis-container">
      <div className="game-analysis-layout">
        <div className="board-section">
          <ChessboardPanel
            position={chessGame.position}
            orientation={isUserWhite ? 'white' : 'black'}
            boardSize={boardSize}
            evaluation={evaluation}
            onPieceDrop={onDrop}
            onPieceClick={chessGame.onPieceClick}
            onSquareClick={chessGame.onSquareClick}
            onPieceDragBegin={chessGame.onPieceDragBegin}
            onPieceDragEnd={chessGame.onPieceDragEnd}
            customSquareStyles={chessGame.customSquareStyles}
            topPlayer={topPlayer}
            bottomPlayer={bottomPlayer}
            boardWrapperRef={boardWrapperRef}
          />
          <MoveControls
            onFirst={chessGame.goToStart}
            onPrev={chessGame.goBack}
            onNext={chessGame.goForward}
            onLast={chessGame.goToEnd}
            showSync={chessGame.isExploring}
            onSync={chessGame.syncToGameMove}
          />
        </div>

        <div className="analysis-section">
          <div className="game-header">
            <button className="back-btn" onClick={() => navigate('/games')}>&#8592; Back</button>
            <div className="game-meta-info">
              <span className="game-date">{formatDateShort(game.end_time)}</span>
              <span className="game-result-text">{getResultText(game)}</span>
            </div>
          </div>

          <EngineLines
            topLines={topLines}
            isAnalyzing={isAnalyzing}
            evaluation={evaluation}
            bestMove={bestMove}
            error={engineError}
          />

          <MoveList
            moveHistory={chessGame.moveHistory}
            currentMoveIndex={chessGame.currentMoveIndex}
            onMoveClick={chessGame.goToMove}
          />
        </div>
      </div>
    </div>
  )
}

export default GameAnalysis
