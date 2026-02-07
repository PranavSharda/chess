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
              <div className="feature-icon">🎯</div>
              <h3>Practice Anytime</h3>
              <p>Play games, solve puzzles, and analyze positions whenever you want.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor your rating, review your games, and see your improvement over time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Compete</h3>
              <p>Join tournaments, challenge friends, and climb the leaderboards.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Lichess Integration</h3>
              <p>Connect your Lichess account and sync your games automatically.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

