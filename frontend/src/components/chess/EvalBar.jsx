import React, { useMemo } from 'react'
import { formatEval } from '../../utils/formatters'
import './EvalBar.css'

function EvalBar({ evaluation }) {
  const whitePercent = useMemo(() => {
    if (!evaluation) return 50
    const val = evaluation.type === 'cp'
      ? evaluation.value / 100
      : (evaluation.type === 'mate' ? (evaluation.value > 0 ? 10 : -10) : 0)
    const clamped = Math.max(-5, Math.min(5, val))
    return 50 + (clamped * 10)
  }, [evaluation])

  const evalText = formatEval(evaluation)
  const isWhiteBetter = whitePercent >= 50

  return (
    <div className="eval-bar-container">
      <div
        className={`eval-bar-fill ${whitePercent < 50 ? 'black-advantage' : ''}`}
        style={{ height: `${whitePercent}%` }}
      />
      <span className={`eval-number ${isWhiteBetter ? 'eval-bottom' : 'eval-top'}`}>
        {evalText}
      </span>
    </div>
  )
}

export default EvalBar
