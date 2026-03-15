import { useState, useEffect } from 'react'

const MIN_BOARD = 280
const MAX_BOARD = 860

export default function useBoardSize(containerRef) {
  const [boardSize, setBoardSize] = useState(400)

  useEffect(() => {
    const updateSize = () => {
      // Size based on viewport height (like chess.com) - board + player bars + controls should fit
      const vh = window.innerHeight
      const heightBased = vh - 120 // leave room for player bars + small padding

      // Also respect container width minus eval bar
      const el = containerRef.current
      const widthBased = el ? el.clientWidth - 28 : heightBased

      const size = Math.min(heightBased, widthBased)
      setBoardSize(Math.max(MIN_BOARD, Math.min(MAX_BOARD, size)))
    }

    updateSize()
    window.addEventListener('resize', updateSize)

    const el = containerRef.current
    let ro
    if (el) {
      ro = new ResizeObserver(updateSize)
      ro.observe(el)
    }

    return () => {
      window.removeEventListener('resize', updateSize)
      if (ro) ro.disconnect()
    }
  }, [containerRef])

  return boardSize
}
