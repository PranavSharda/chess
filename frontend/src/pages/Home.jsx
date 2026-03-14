import React from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Every Move <span className="gradient-text">Matters</span>
          </h1>
          <p className="hero-subtitle">
            Master chess tactics, study openings, and improve your game.
            In chess, every position demands the right move—no matter how forced.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/signin" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="chess-board">
            <div className="board-grid">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`square ${(Math.floor(i / 8) + i) % 2 === 0 ? 'light' : 'dark'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Chess Vector?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">&#x1F50D;</div>
              <h3>Deep Analysis</h3>
              <p>Analyze every move with Stockfish engine running in your browser at depth 18.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x1F9E9;</div>
              <h3>Your Puzzles</h3>
              <p>Auto-generated puzzles from your own games — practice your real weaknesses.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x1F4AC;</div>
              <h3>AI Coach</h3>
              <p>Describe what you want to practice and get personalized puzzle sets served to you.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x1F4C8;</div>
              <h3>Trend Insights</h3>
              <p>Track your rating, win rate, blunder frequency, and opening accuracy over time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">&#x1F517;</div>
              <h3>Chess.com Sync</h3>
              <p>Connect your Chess.com account and import your games automatically.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
