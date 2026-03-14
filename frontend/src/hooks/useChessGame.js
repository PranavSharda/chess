import { useState, useCallback, useMemo } from 'react'
import { Chess } from 'chess.js'

export default function useChessGame() {
  const [chess, setChess] = useState(() => new Chess())
  const [gamePosition, setGamePosition] = useState('start')
  const [moveHistory, setMoveHistory] = useState([])
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1)
  const [selectedSquare, setSelectedSquare] = useState(null)

  const loadPgn = useCallback((pgnString) => {
    try {
      const newChess = new Chess()
      newChess.loadPgn(pgnString)
      const moves = newChess.history({ verbose: true })
      setMoveHistory(moves)
      setCurrentMoveIndex(-1)
      setGamePosition('start')
      setChess(new Chess())
      setSelectedSquare(null)
    } catch (err) {
      console.error('Error loading PGN:', err)
    }
  }, [])

  const goToMove = useCallback((index) => {
    if (index < -1 || index >= moveHistory.length) return
    const tempChess = new Chess()
    for (let i = 0; i <= index; i++) {
      if (moveHistory[i]) tempChess.move(moveHistory[i])
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
    if (moveHistory.length > 0) goToMove(moveHistory.length - 1)
  }, [moveHistory, goToMove])

  const goBack = useCallback(() => {
    goToMove(currentMoveIndex - 1)
  }, [currentMoveIndex, goToMove])

  const goForward = useCallback(() => {
    if (currentMoveIndex < moveHistory.length - 1) goToMove(currentMoveIndex + 1)
  }, [currentMoveIndex, moveHistory, goToMove])

  const boardPosition = useMemo(() => {
    if (gamePosition === 'start' || !gamePosition) return new Chess().fen()
    return gamePosition
  }, [gamePosition])

  const isExploring = useMemo(() => {
    if (moveHistory.length === 0) return false
    const gameChess = new Chess()
    for (let i = 0; i <= currentMoveIndex && i < moveHistory.length; i++) {
      if (moveHistory[i]) gameChess.move(moveHistory[i])
    }
    return boardPosition !== gameChess.fen()
  }, [boardPosition, currentMoveIndex, moveHistory])

  const syncToGameMove = useCallback(() => {
    goToMove(currentMoveIndex)
  }, [currentMoveIndex, goToMove])

  const makeMove = useCallback((from, to) => {
    try {
      const move = chess.move({ from, to, promotion: 'q' })
      if (!move) return false
      setGamePosition(chess.fen())
      setSelectedSquare(null)
      return true
    } catch {
      return false
    }
  }, [chess])

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
  }, [selectedSquare, boardPosition, chess])

  const onPieceClick = useCallback((piece, square) => {
    try {
      if (!piece || typeof piece !== 'string' || !chess || typeof chess.turn !== 'function') return
      const turn = chess.turn()
      const pieceColor = piece.startsWith('w') ? 'w' : 'b'
      if (pieceColor !== turn) { setSelectedSquare(null); return }
      setSelectedSquare((prev) => (prev === square ? null : square))
    } catch { setSelectedSquare(null) }
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
        if (move) { setGamePosition(chess.fen()); setSelectedSquare(null) }
      } else {
        const turn = chess.turn()
        setSelectedSquare(piece && typeof piece === 'string' && piece.startsWith(turn === 'w' ? 'w' : 'b') ? square : null)
      }
    } catch { setSelectedSquare(null) }
  }, [selectedSquare, chess])

  const onPieceDragBegin = useCallback((_piece, sourceSquare) => {
    setSelectedSquare(sourceSquare)
  }, [])

  const onPieceDragEnd = useCallback(() => {
    setSelectedSquare(null)
  }, [])

  return {
    chess,
    position: boardPosition,
    moveHistory,
    currentMoveIndex,
    isExploring,
    customSquareStyles,
    loadPgn,
    goToMove,
    goToStart,
    goToEnd,
    goBack,
    goForward,
    makeMove,
    syncToGameMove,
    onPieceClick,
    onSquareClick,
    onPieceDragBegin,
    onPieceDragEnd,
  }
}
