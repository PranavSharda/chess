import React from 'react'
import { formatLineEval, formatEval, getLineEvalValue } from '../../utils/formatters'
import Spinner from '../ui/Spinner'
import './EngineLines.css'

function EngineLines({ topLines, isAnalyzing, evaluation, bestMove, error }) {
  return (
    <div className="engine-lines-panel">
      <div className="lines-header">
        <span className="lines-title">Analysis</span>
        <span className="engine-info">depth=18 | Stockfish</span>
      </div>

      {isAnalyzing && topLines.length === 0 && (
        <div className="lines-loading">
          <Spinner size="sm" />
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

        {!isAnalyzing && topLines.length === 0 && !error && (
          <div className="no-lines">
            {evaluation != null ? (
              <>
                <span className="line-eval-small">{formatEval(evaluation)}</span>
                <span className="no-lines-msg">No alternative lines for this position</span>
              </>
            ) : (
              'No analysis available'
            )}
          </div>
        )}
        {error && <div className="no-lines analysis-error">{error}</div>}
      </div>

      {evaluation && (
        <div className="current-move-card">
          <span className={`move-eval-badge ${(evaluation.type === 'cp' ? evaluation.value : (evaluation.type === 'mate' && evaluation.value > 0 ? 1 : -1)) > 0 ? 'white-good' : 'black-good'}`}>
            {formatEval(evaluation)}
          </span>
          <span className="current-move-text">Best move: {bestMove || '\u2014'}</span>
        </div>
      )}
    </div>
  )
}

export default EngineLines
