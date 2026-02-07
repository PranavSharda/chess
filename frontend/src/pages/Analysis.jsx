import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Analysis.css'

function Analysis({ user, onUserUpdate }) {
  const navigate = useNavigate()
  const [chessUsername, setChessUsername] = useState(user?.chess_com_username || '')
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [linkingUsername, setLinkingUsername] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalGames, setTotalGames] = useState(0)
  const gamesPerPage = 10

  const isLinked = user?.chess_com_username

  useEffect(() => {
    if (isLinked) {
      fetchGames()
    }
  }, [isLinked, user?.chess_com_username])

  const fetchGames = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/user/${user.id}/chess-com/games`
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to fetch games')
      }
      
      const data = await response.json()
      setGames(data.games || [])
      setTotalGames(data.total || 0)
      setCurrentPage(1)
    } catch (err) {
      setError(err.message || 'Failed to fetch games')
      setGames([])
      setTotalGames(0)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkUsername = async (e) => {
    e.preventDefault()
    if (!chessUsername.trim()) return
    
    setLinkingUsername(true)
    setError('')
    
    try {
      // Update user in backend (backend will verify the username)
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/user/${user.id}/chess-com`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chess_com_username: chessUsername.toLowerCase() })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Failed to save username')
      }
      
      const updatedUserData = await response.json()
      const updatedUser = { ...user, chess_com_username: updatedUserData.chess_com_username }
      onUserUpdate(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Fetch games after linking username
      fetchGames()
    } catch (err) {
      setError(err.message || 'Failed to link username')
    } finally {
      setLinkingUsername(false)
    }
  }

  const handleAnalyzeGame = (game) => {
    // Store game data for analysis page
    sessionStorage.setItem('analyzeGame', JSON.stringify(game))
    navigate('/analyze-game')
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getGameResult = (game) => {
    const isWhite = game.white?.username?.toLowerCase() === user.chess_com_username?.toLowerCase()
    const playerData = isWhite ? game.white : game.black
    const result = playerData?.result
    
    if (result === 'win') return { text: 'Won', class: 'result-win' }
    if (result === 'checkmated' || result === 'resigned' || result === 'timeout' || result === 'abandoned') {
      return { text: 'Lost', class: 'result-loss' }
    }
    return { text: 'Draw', class: 'result-draw' }
  }

  const getOpponent = (game) => {
    const isWhite = game.white?.username?.toLowerCase() === user.chess_com_username?.toLowerCase()
    return isWhite ? game.black : game.white
  }

  const getTimeControl = (game) => {
    const tc = game.time_control
    if (!tc) return 'Unknown'
    
    const parts = tc.split('+')
    const base = parseInt(parts[0])
    const increment = parts[1] ? parseInt(parts[1]) : 0
    
    if (base < 180) return 'Bullet'
    if (base < 600) return 'Blitz'
    if (base < 1800) return 'Rapid'
    return 'Classical'
  }

  const paginatedGames = games.slice(
    (currentPage - 1) * gamesPerPage,
    currentPage * gamesPerPage
  )
  
  const totalPages = Math.ceil(totalGames / gamesPerPage)

  // Not linked - show linking form
  if (!isLinked) {
    return (
      <div className="analysis-container">
        <div className="analysis-card link-card">
          <div className="link-icon">♟️</div>
          <h1>Connect Your Chess.com Account</h1>
          <p className="link-description">
            Enter your Chess.com username to analyze your recent games and track your progress.
          </p>
          
          <form onSubmit={handleLinkUsername} className="link-form">
            <div className="input-wrapper">
              <span className="input-prefix">chess.com/member/</span>
              <input
                type="text"
                value={chessUsername}
                onChange={(e) => setChessUsername(e.target.value)}
                placeholder="your-username"
                className="username-input"
                disabled={linkingUsername}
              />
            </div>
            
            {error && <p className="error-message">{error}</p>}
            
            <button 
              type="submit" 
              className="link-button"
              disabled={linkingUsername || !chessUsername.trim()}
            >
              {linkingUsername ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : (
                'Connect Account'
              )}
            </button>
          </form>
          
          <div className="link-info">
            <div className="info-icon">ℹ️</div>
            <p>We only access your public game data. Your password is never shared.</p>
          </div>
        </div>
      </div>
    )
  }

  // Linked - show games
  return (
    <div className="analysis-container">
      <div className="analysis-card">
        <div className="analysis-header">
          <div className="header-content">
            <h1>Game Analysis</h1>
            <p className="header-subtitle">
              Connected as <span className="username-badge">{user.chess_com_username}</span>
            </p>
          </div>
          <button 
            onClick={() => fetchGames()} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : '↻'} Refresh
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Fetching your games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No Games Found</h2>
            <p>Play some games on Chess.com and they'll appear here!</p>
          </div>
        ) : (
          <>
            <div className="games-list">
              {paginatedGames.map((game, index) => {
                const result = getGameResult(game)
                const opponent = getOpponent(game)
                const isWhite = game.white?.username?.toLowerCase() === user.chess_com_username?.toLowerCase()
                
                return (
                  <div key={game.uuid || index} className="game-card">
                    <div className="game-main">
                      <div className="game-color">
                        <div className={`piece-indicator ${isWhite ? 'white-piece' : 'black-piece'}`}>
                          {isWhite ? '♔' : '♚'}
                        </div>
                      </div>
                      
                      <div className="game-info">
                        <div className="opponent-row">
                          <span className="vs-text">vs</span>
                          <span className="opponent-name">{opponent?.username || 'Unknown'}</span>
                          <span className="opponent-rating">({opponent?.rating || '?'})</span>
                        </div>
                        <div className="game-meta">
                          <span className="time-control">{getTimeControl(game)}</span>
                          <span className="separator">•</span>
                          <span className="game-date">{formatDate(game.end_time)}</span>
                        </div>
                      </div>
                      
                      <div className={`game-result ${result.class}`}>
                        {result.text}
                      </div>
                    </div>
                    
                    <button 
                      className="analyze-button"
                      onClick={() => handleAnalyzeGame(game)}
                    >
                      <span className="analyze-icon">🔍</span>
                      Analyze
                    </button>
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                <div className="page-info">
                  Page {currentPage} of {totalPages}
                  <span className="total-games">({totalGames} games)</span>
                </div>
                
                <button 
                  className="page-button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Analysis
