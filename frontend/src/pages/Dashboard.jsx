import React from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/signin')
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user.username}!</h1>
            <p className="welcome-message">Analyze your games, study tactics, and improve your rating</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2 className="section-heading">Profile Information</h2>
            <div className="info-card">
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{user.email}</span>
              </div>
              {user.lichess_id && (
                <div className="info-item">
                  <span className="info-label">Lichess ID</span>
                  <span className="info-value">{user.lichess_id}</span>
                </div>
              )}
              {user.chess_com_username && (
                <div className="info-item">
                  <span className="info-label">Chess.com</span>
                  <span className="info-value">{user.chess_com_username}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">User ID</span>
                <span className="info-value">{user.id}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2 className="section-heading">Quick Actions</h2>
            <div className="actions-card">
              <div className="action-item" onClick={() => navigate('/analysis')}>
                <div className="action-icon">🔍</div>
                <div>
                  <h3>Game Analysis</h3>
                  <p>Analyze your Chess.com games</p>
                </div>
              </div>
              <div className="action-item">
                <div className="action-icon">📊</div>
                <div>
                  <h3>View Statistics</h3>
                  <p>Track your progress and performance</p>
                </div>
              </div>
              <div className="action-item">
                <div className="action-icon">🎮</div>
                <div>
                  <h3>Play Game</h3>
                  <p>Start a new chess game</p>
                </div>
              </div>
              <div className="action-item">
                <div className="action-icon">📚</div>
                <div>
                  <h3>Learn</h3>
                  <p>Study openings and tactics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

