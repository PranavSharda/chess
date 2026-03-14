import React from 'react'
import './MoveControls.css'

function MoveControls({ onFirst, onPrev, onNext, onLast, showSync, onSync }) {
  return (
    <div className="move-controls">
      <button className="control-btn" onClick={onFirst} title="First move">&#x23EE;</button>
      <button className="control-btn" onClick={onPrev} title="Previous move">&#x25C0;</button>
      <button className="control-btn play-btn" onClick={onNext} title="Next move">&#x25B6;</button>
      <button className="control-btn" onClick={onLast} title="Last move">&#x23ED;</button>
      {showSync && (
        <button className="control-btn sync-btn" onClick={onSync} title="Back to game position">
          Sync
        </button>
      )}
    </div>
  )
}

export default MoveControls
