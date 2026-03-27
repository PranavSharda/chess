import { useState, useCallback, useMemo, useRef } from 'react'
import { Chess } from 'chess.js'
import { playMoveSound } from '../utils/sounds'

let nextNodeId = 0

function createNode(move, fen, parent) {
  return { id: nextNodeId++, move, fen, children: [], parent }
}

function getMainLine(root) {
  const nodes = []
  let node = root
  while (node.children.length > 0) {
    node = node.children[0]
    nodes.push(node)
  }
  return nodes
}

function checkOnMainLine(node, root) {
  let n = node
  while (n.parent) {
    if (n.parent.children[0] !== n) return false
    n = n.parent
  }
  return n === root
}

export default function useChessGame() {
  const rootRef = useRef(createNode(null, new Chess().fen(), null))
  const [currentNode, setCurrentNode] = useState(rootRef.current)
  const [treeVersion, setTreeVersion] = useState(0)
  const [selectedSquare, setSelectedSquare] = useState(null)

  const chess = useMemo(() => {
    try {
      return new Chess(currentNode.fen)
    } catch {
      return new Chess()
    }
  }, [currentNode])

  const position = currentNode.fen

  const mainLine = useMemo(
    () => getMainLine(rootRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [treeVersion]
  )

  const currentMoveIndex = useMemo(() => {
    if (currentNode === rootRef.current) return -1
    const idx = mainLine.indexOf(currentNode)
    return idx
  }, [currentNode, mainLine])

  const moveHistory = useMemo(() => mainLine.map((n) => n.move), [mainLine])

  const isExploring = useMemo(
    () => !checkOnMainLine(currentNode, rootRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentNode, treeVersion]
  )

  const loadPgn = useCallback((pgnString) => {
    try {
      const pgn = new Chess()
      pgn.loadPgn(pgnString)
      const moves = pgn.history({ verbose: true })

      nextNodeId = 0
      const newRoot = createNode(null, new Chess().fen(), null)
      let current = newRoot
      const tempChess = new Chess()

      for (const move of moves) {
        tempChess.move(move)
        const child = createNode(move, tempChess.fen(), current)
        current.children.push(child)
        current = child
      }

      rootRef.current = newRoot
      setCurrentNode(newRoot)
      setSelectedSquare(null)
      setTreeVersion((v) => v + 1)
    } catch (err) {
      console.error('Error loading PGN:', err)
    }
  }, [])

  const goToNode = useCallback((node) => {
    setCurrentNode(node)
    setSelectedSquare(null)
    if (node.move) playMoveSound(node.move)
  }, [])

  const goToMove = useCallback(
    (index) => {
      if (index < -1 || index >= mainLine.length) return
      const node = index === -1 ? rootRef.current : mainLine[index]
      setCurrentNode(node)
      setSelectedSquare(null)
      if (node.move) playMoveSound(node.move)
    },
    [mainLine]
  )

  const goToStart = useCallback(() => {
    setCurrentNode(rootRef.current)
    setSelectedSquare(null)
  }, [])

  const goToEnd = useCallback(() => {
    let node = currentNode
    while (node.children.length > 0) node = node.children[0]
    setCurrentNode(node)
    setSelectedSquare(null)
  }, [currentNode])

  const goBack = useCallback(() => {
    if (currentNode.parent) {
      setCurrentNode(currentNode.parent)
      setSelectedSquare(null)
      playMoveSound(currentNode.move)
    }
  }, [currentNode])

  const goForward = useCallback(() => {
    if (currentNode.children.length > 0) {
      const next = currentNode.children[0]
      setCurrentNode(next)
      setSelectedSquare(null)
      playMoveSound(next.move)
    }
  }, [currentNode])

  const syncToGameMove = useCallback(() => {
    let node = currentNode
    while (node && !checkOnMainLine(node, rootRef.current)) {
      node = node.parent
    }
    if (node) setCurrentNode(node)
    setSelectedSquare(null)
  }, [currentNode])

  const makeMove = useCallback(
    (from, to) => {
      try {
        const tempChess = new Chess(currentNode.fen)
        const move = tempChess.move({ from, to, promotion: 'q' })
        if (!move) return false

        const existing = currentNode.children.find(
          (c) =>
            c.move.from === move.from &&
            c.move.to === move.to &&
            (c.move.promotion || '') === (move.promotion || '')
        )

        if (existing) {
          setCurrentNode(existing)
          playMoveSound(existing.move)
          return existing.move
        }

        const newNode = createNode(move, tempChess.fen(), currentNode)
        currentNode.children.push(newNode)
        setCurrentNode(newNode)
        setTreeVersion((v) => v + 1)
        setSelectedSquare(null)
        playMoveSound(move)
        return move
      } catch {
        return false
      }
    },
    [currentNode]
  )

  const deleteVariation = useCallback(
    (node) => {
      if (!node.parent) return
      const parent = node.parent
      const idx = parent.children.indexOf(node)
      if (idx > 0) {
        parent.children.splice(idx, 1)
        let n = currentNode
        while (n) {
          if (n === node) {
            setCurrentNode(parent)
            break
          }
          n = n.parent
        }
        setTreeVersion((v) => v + 1)
      }
    },
    [currentNode]
  )

  const promoteVariation = useCallback((node) => {
    if (!node.parent) return
    const parent = node.parent
    const idx = parent.children.indexOf(node)
    if (idx > 0) {
      ;[parent.children[0], parent.children[idx]] = [parent.children[idx], parent.children[0]]
      setTreeVersion((v) => v + 1)
    }
  }, [])

  const customSquareStyles = useMemo(() => {
    try {
      if (!selectedSquare) return {}
      const isOver =
        typeof chess.isGameOver === 'function'
          ? chess.isGameOver()
          : typeof chess.game_over === 'function'
            ? chess.game_over()
            : false
      if (isOver) return {}
      const moves = chess.moves({ square: selectedSquare, verbose: true })
      if (!Array.isArray(moves) || !moves.length) return {}
      const styles = {
        [selectedSquare]: {
          background: 'rgba(255, 255, 0, 0.4)',
          borderRadius: '0',
        },
      }
      moves.forEach((m) => {
        if (!m || !m.to) return
        const isCapture = chess.get && chess.get(m.to)
        styles[m.to] = isCapture
          ? {
              background: 'radial-gradient(transparent 51%, rgba(0, 0, 0, 0.3) 51%)',
              borderRadius: '50%',
            }
          : {
              background: 'radial-gradient(rgba(0, 0, 0, 0.25) 25%, transparent 25%)',
              borderRadius: '50%',
            }
      })
      return styles
    } catch {
      return {}
    }
  }, [selectedSquare, position, chess])

  const onPieceClick = useCallback(
    (piece, square) => {
      try {
        if (!piece || typeof piece !== 'string') return
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
    },
    [chess]
  )

  const onSquareClick = useCallback(
    (square, piece) => {
      try {
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
          makeMove(selectedSquare, square)
        } else {
          const turn = chess.turn()
          setSelectedSquare(
            piece && typeof piece === 'string' && piece.startsWith(turn === 'w' ? 'w' : 'b')
              ? square
              : null
          )
        }
      } catch {
        setSelectedSquare(null)
      }
    },
    [selectedSquare, chess, makeMove]
  )

  const onPieceDragBegin = useCallback((_piece, sourceSquare) => {
    setSelectedSquare(sourceSquare)
  }, [])

  const onPieceDragEnd = useCallback(() => {
    setSelectedSquare(null)
  }, [])

  return {
    chess,
    position,
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
    // Tree API
    root: rootRef,
    currentNode,
    goToNode,
    treeVersion,
    deleteVariation,
    promoteVariation,
  }
}
