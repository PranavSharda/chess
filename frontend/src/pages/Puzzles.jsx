import React from 'react'
import Card from '../components/ui/Card'
import './Puzzles.css'

function Puzzles() {
  return (
    <div className="puzzles-page">
      <h1 className="page-title">Puzzles</h1>
      <p className="page-subtitle">Practice tactics generated from your own games</p>

      <div className="puzzles-stats">
        <Card className="stat-card"><div className="stat-value">0</div><div className="stat-label">Total</div></Card>
        <Card className="stat-card"><div className="stat-value">0</div><div className="stat-label">Solved</div></Card>
        <Card className="stat-card"><div className="stat-value">0</div><div className="stat-label">Unsolved</div></Card>
        <Card className="stat-card"><div className="stat-value">0</div><div className="stat-label">Streak</div></Card>
      </div>

      <div className="coming-soon-section">
        <div className="coming-soon-icon">&#x1F9E9;</div>
        <h2>Coming Soon</h2>
        <p>Puzzles will be auto-generated from critical moments in your games — positions where you or your opponent blundered.</p>
      </div>
    </div>
  )
}

export default Puzzles
