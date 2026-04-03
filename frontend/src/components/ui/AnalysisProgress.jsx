import React, { useState, useEffect } from 'react'
import { useAnalysisQueue } from '../../contexts/AnalysisQueueContext'
import './AnalysisProgress.css'

function AnalysisProgress() {
  const {
    completedCount,
    totalQueued,
    activeWorkers,
    isProcessing,
    error,
    queueLength,
    pauseQueue,
    resumeQueue,
    cancelQueue,
  } = useAnalysisQueue()

  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed when a new batch starts
  useEffect(() => {
    if (isProcessing) setDismissed(false)
  }, [isProcessing])

  const isPaused = !isProcessing && queueLength > 0
  const isDone = !isProcessing && !isPaused && totalQueued > 0 && !error

  if (dismissed) return null
  if (!isProcessing && !error && totalQueued === 0) return null

  const dismissBar = () => setDismissed(true)
  const overallPercent = totalQueued > 0
    ? (completedCount / totalQueued) * 100
    : 0

  const statusText = error
    ? 'Analysis failed'
    : isPaused
      ? 'Analysis paused'
      : isProcessing
        ? `Analyzing: ${completedCount} / ${totalQueued} games — ${activeWorkers} workers active`
        : `Analysis complete (${completedCount} games)`

  return (
    <div className="analysis-progress">
      <div className="analysis-progress-info">
        <span className="analysis-progress-label">{statusText}</span>
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
            &#9646;&#9646; Pause
          </button>
        )}
        {isPaused && (
          <button className="analysis-progress-btn" onClick={resumeQueue} title="Resume">
            &#9654; Resume
          </button>
        )}
        {(isProcessing || isPaused) && (
          <button className="analysis-progress-btn cancel" onClick={cancelQueue} title="Stop analysis">
            &#10005; Stop
          </button>
        )}
        {isDone && (
          <button className="analysis-progress-btn" onClick={dismissBar} title="Dismiss">
            &#10005;
          </button>
        )}
      </div>
    </div>
  )
}

export default AnalysisProgress
