import React from 'react'
import Card from '../components/ui/Card'
import './Coach.css'

function Coach() {
  return (
    <div className="coach-page">
      <h1 className="page-title">AI Coach</h1>
      <p className="page-subtitle">Get personalized training recommendations</p>

      <div className="coach-chat">
        <div className="chat-messages">
          <div className="coming-soon-section">
            <div className="coming-soon-icon">&#x1F4AC;</div>
            <h2>Coming Soon</h2>
            <p>Tell the AI what you want to practice and it will serve you matching puzzles from your games.</p>
          </div>
        </div>

        <div className="chat-suggestions">
          <Card className="suggestion-card">I keep missing forks</Card>
          <Card className="suggestion-card">Give me hard puzzles from my last 10 games</Card>
          <Card className="suggestion-card">Practice endgames</Card>
          <Card className="suggestion-card">Help me with back rank tactics</Card>
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Describe what you'd like to practice..."
            disabled
          />
          <button className="chat-send" disabled>Send</button>
        </div>
      </div>
    </div>
  )
}

export default Coach
