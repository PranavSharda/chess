import { useState, useEffect } from 'react'

const MIN_BOARD = 280
const MAX_BOARD = 760

export default function useBoardSize(containerRef) {
  const [boardSize, setBoardSize] = useState(400)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      const w = el.clientWidth
      const available = w - 44 - 16
      setBoardSize(Math.max(MIN_BOARD, Math.min(MAX_BOARD, available)))
    }

    updateSize()
    const ro = new ResizeObserver(updateSize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])

  return boardSize
}
