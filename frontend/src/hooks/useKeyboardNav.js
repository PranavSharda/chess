import { useEffect } from 'react'

export default function useKeyboardNav({ onLeft, onRight, onHome, onEnd }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') onLeft?.()
      else if (e.key === 'ArrowRight') onRight?.()
      else if (e.key === 'ArrowUp') { e.preventDefault(); onHome?.() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onEnd?.() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onLeft, onRight, onHome, onEnd])
}
