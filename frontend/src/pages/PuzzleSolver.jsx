import React from 'react'
import { useParams } from 'react-router-dom'
import './PuzzleSolver.css'

function PuzzleSolver() {
  const { puzzleId } = useParams()

  return (
    <div className="puzzle-solver-page">
      <div className="coming-soon-section">
        <div className="coming-soon-icon">&#x1F9E9;</div>
        <h2>Puzzle Solver — Coming Soon</h2>
        <p>Puzzle #{puzzleId} will be playable here with an interactive board, hints, and solutions.</p>
      </div>
    </div>
  )
}

export default PuzzleSolver
