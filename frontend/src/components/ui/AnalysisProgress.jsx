import React from 'react'
import { useAnalysisQueue } from '../../contexts/AnalysisQueueContext'
import './AnalysisProgress.css'

function AnalysisProgress() {
  const {
    queue,
    currentGame,
    currentMove,
    totalMoves,
    completedCount,
    totalQueued,
    isProcessing,
    error,
    pauseQueue,
    resumeQueue,
    cancelQueue,
  } = useAnalysisQueue()

  if (!isProcessing && !error && totalQueued === 0) return null

  const isPaused = !isProcessing && queue.length > 0
  const gameProgress = totalQueued > 0
    ? `Game ${completedCount + 1} / ${totalQueued}`
    : ''
  const moveProgress = totalMoves > 0
    ? `Move ${currentMove} / ${totalMoves}`
    : 'Starting...'
  const overallPercent = totalQueued > 0
    ? ((completedCount + (totalMoves > 0 ? currentMove / totalMoves : 0)) / totalQueued) * 100
    : 0

  return (
    <div className="analysis-progress">
      <div className="analysis-progress-info">
        <span className="analysis-progress-label">
          {error
            ? `Analysis failed`
            : isPaused
              ? 'Analysis paused'
              : isProcessing
                ? `Analyzing: ${gameProgress} — ${moveProgress}`
                : `Analysis complete (${completedCount} games)`}
        </span>
        {error && (
          <span className="analysis-progress-error">{error.message}</span>
        )}
      </div>

      <div className="analysis-progress-bar-track">
        <div
          className={`analysis-progress-bar-fill${isPaused ? ' paused' : ''}${error ? ' error' : ''}`}
          style={{ width: `${Math.min(overallPercent, 100)}%` }}
        />
      </div>

      <div className="analysis-progress-actions">
        {isProcessing && (
          <button className="analysis-progress-btn" onClick={pauseQueue} title="Pause">
            &#9646;&#9646;
          </button>
        )}
        {isPaused && (
          <button className="analysis-progress-btn" onClick={resumeQueue} title="Resume">
            &#9654;
          </button>
        )}
        {(isProcessing || isPaused) && (
          <button className="analysis-progress-btn cancel" onClick={cancelQueue} title="Cancel">
            &#10005;
          </button>
        )}
      </div>
    </div>
  )
}

export default AnalysisProgress
