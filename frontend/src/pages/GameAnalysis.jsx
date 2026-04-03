import React, { useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
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
import { playMoveSound } from '../utils/sounds'
import './GameAnalysis.css'

function GameAnalysis() {
  const { gameId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const boardWrapperRef = useRef(null)

  const { game, isLoading: gameLoading, error: gameError } = useGame(gameId)
  const chessGame = useChessGame()
  const boardSize = useBoardSize(boardWrapperRef)
  const { evaluation, topLines, bestMove, isAnalyzing, error: engineError } = useStockfish(chessGame.position)

  // Play sound on move navigation
  const prevNodeRef = useRef(null)
  useEffect(() => {
    const node = chessGame.currentNode
    if (node !== prevNodeRef.current && node?.move) {
      playMoveSound(node.move)
    }
    prevNodeRef.current = node
  }, [chessGame.currentNode])

  useKeyboardNav({
    onLeft: chessGame.goBack,
    onRight: chessGame.goForward,
    onHome: chessGame.goToStart,
    onEnd: chessGame.goToEnd,
  })

  useEffect(() => {
    if (game?.pgn) {
      const moveParam = searchParams.get('move')
      const startAt = moveParam != null ? parseInt(moveParam, 10) : undefined
      chessGame.loadPgn(game.pgn, { startAtMove: isNaN(startAt) ? undefined : startAt })
    }
  }, [game])

  const isUserWhite = useMemo(() => {
    if (!game || !user) return true
    return getIsWhite(game, user.chess_com_username)
  }, [game, user])

  const whitePlayer = { username: game?.white_username, rating: game?.white_rating }
  const blackPlayer = { username: game?.black_username, rating: game?.black_rating }
  const topPlayer = isUserWhite ? blackPlayer : whitePlayer
  const bottomPlayer = isUserWhite ? whitePlayer : blackPlayer

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

  const onDrop = (src, tgt) => !!chessGame.makeMove(src, tgt)

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
            root={chessGame.root}
            currentNode={chessGame.currentNode}
            onNodeClick={chessGame.goToNode}
            treeVersion={chessGame.treeVersion}
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
      </div>
    </div>
  )
}

export default GameAnalysis
