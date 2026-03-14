import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dash">
      <div className="dash-greeting">
        <h1>Welcome back, <span className="dash-username">{user?.username}</span></h1>
        <p>Here's your chess overview</p>
      </div>

      <div className="dash-stats">
        <div className="stat-tile">
          <span className="stat-number">--</span>
          <span className="stat-desc">Games Imported</span>
        </div>
        <div className="stat-tile">
          <span className="stat-number">--%</span>
          <span className="stat-desc">Win Rate</span>
        </div>
        <div className="stat-tile">
          <span className="stat-number">--</span>
          <span className="stat-desc">Current Rating</span>
        </div>
        <div className="stat-tile">
          <span className="stat-number">0</span>
          <span className="stat-desc">Unsolved Puzzles</span>
        </div>
      </div>

      <div className="dash-sections">
        <div className="dash-col">
          <h2 className="dash-section-title">Quick Actions</h2>
          <div className="dash-actions">
            <button className="dash-action" onClick={() => navigate('/games')}>
              <div className="dash-action-icon green">&#x2658;</div>
              <div className="dash-action-body">
                <strong>Analyze Games</strong>
                <span>Review and learn from your Chess.com games</span>
              </div>
              <span className="dash-action-arrow">&#8250;</span>
            </button>
            <button className="dash-action" onClick={() => navigate('/trends')}>
              <div className="dash-action-icon blue">&#x2197;</div>
              <div className="dash-action-body">
                <strong>View Trends</strong>
                <span>Track rating, accuracy &amp; blunder frequency</span>
              </div>
              <span className="dash-action-arrow">&#8250;</span>
            </button>
            <button className="dash-action" onClick={() => navigate('/puzzles')}>
              <div className="dash-action-icon amber">&#x2726;</div>
              <div className="dash-action-body">
                <strong>Solve Puzzles</strong>
                <span>Tactics generated from your own games</span>
              </div>
              <span className="dash-action-arrow">&#8250;</span>
            </button>
            <button className="dash-action" onClick={() => navigate('/coach')}>
              <div className="dash-action-icon purple">&#x2637;</div>
              <div className="dash-action-body">
                <strong>AI Coach</strong>
                <span>Personalized training recommendations</span>
              </div>
              <span className="dash-action-arrow">&#8250;</span>
            </button>
          </div>
        </div>

        <div className="dash-col">
          <h2 className="dash-section-title">Profile</h2>
          <div className="dash-profile">
            <div className="dash-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
            <div className="dash-profile-rows">
              <div className="dash-profile-row">
                <span className="dash-profile-label">Username</span>
                <span className="dash-profile-value">{user?.username}</span>
              </div>
              <div className="dash-profile-row">
                <span className="dash-profile-label">Email</span>
                <span className="dash-profile-value">{user?.email}</span>
              </div>
              {user?.chess_com_username && (
                <div className="dash-profile-row">
                  <span className="dash-profile-label">Chess.com</span>
                  <span className="dash-profile-value linked">{user.chess_com_username}</span>
                </div>
              )}
              {!user?.chess_com_username && (
                <div className="dash-profile-row">
                  <span className="dash-profile-label">Chess.com</span>
                  <button className="dash-link-btn" onClick={() => navigate('/games')}>Link account</button>
                </div>
              )}
              {user?.lichess_id && (
                <div className="dash-profile-row">
                  <span className="dash-profile-label">Lichess</span>
                  <span className="dash-profile-value">{user.lichess_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
