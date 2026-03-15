import React from 'react'
import { Chessboard } from 'react-chessboard'
import EvalBar from './EvalBar'
import './ChessboardPanel.css'

function ChessboardPanel({
  position,
  orientation,
  boardSize,
  evaluation,
  onPieceDrop,
  onPieceClick,
  onSquareClick,
  onPieceDragBegin,
  onPieceDragEnd,
  customSquareStyles,
  topPlayer,
  bottomPlayer,
  boardWrapperRef,
}) {
  const topIsBlack = orientation === 'white'

  return (
    <div className="board-panel">
      <div className="player-bar opponent">
        <span className="piece-icon">{topIsBlack ? '♟' : '♙'}</span>
        <span className="player-name">{topPlayer?.username || 'Unknown'}</span>
        {topPlayer?.rating && <span className="player-rating">({topPlayer.rating})</span>}
      </div>

      <div className="chessboard-wrapper" ref={boardWrapperRef}>
        <EvalBar evaluation={evaluation} />
        <Chessboard
          position={position}
          onPieceDrop={onPieceDrop}
          onPieceClick={onPieceClick}
          onSquareClick={onSquareClick}
          onPieceDragBegin={onPieceDragBegin}
          onPieceDragEnd={onPieceDragEnd}
          arePiecesDraggable={true}
          boardWidth={boardSize}
          boardOrientation={orientation}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{ borderRadius: '2px' }}
          customDarkSquareStyle={{ backgroundColor: '#779952' }}
          customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        />
      </div>

      <div className="player-bar user">
        <span className="piece-icon">{topIsBlack ? '♙' : '♟'}</span>
        <span className="player-name">{bottomPlayer?.username || 'Unknown'}</span>
        {bottomPlayer?.rating && <span className="player-rating">({bottomPlayer.rating})</span>}
      </div>
    </div>
  )
}

export default ChessboardPanel
