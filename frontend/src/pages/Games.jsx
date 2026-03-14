import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useGames from '../hooks/useGames'
import { linkChessComUsername } from '../services/games'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorBanner from '../components/ui/ErrorBanner'
import { formatDate, formatTimeControl } from '../utils/formatters'
import { getGameResult, getOpponent, getIsWhite } from '../utils/chessHelpers'
import './Games.css'

const TIMEFRAME_OPTIONS = [
  { value: '3_months', label: 'Past 3 months' },
  { value: '1_year', label: 'Past 1 year' },
  { value: '5_years', label: 'Past 5 years' },
  { value: '10_years', label: 'Past 10 years' },
]

function Games() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const isLinked = !!user?.chess_com_username
  const {
    games, total, page, setPage, totalPages,
    isLoading, isFetchingChessCom, error,
    refresh, fetchFromChessCom,
  } = useGames(isLinked)

  const [chessUsername, setChessUsername] = useState(user?.chess_com_username || '')
  const [linkingUsername, setLinkingUsername] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [timeframe, setTimeframe] = useState('3_months')

  const handleLinkUsername = async (e) => {
    e.preventDefault()
    if (!chessUsername.trim()) return
    setLinkingUsername(true)
    setLinkError('')
    try {
      const data = await linkChessComUsername(user.id, chessUsername)
      updateUser({ chess_com_username: data.chess_com_username })
    } catch (err) {
      setLinkError(err.response?.data?.detail || err.message || 'Failed to link username')
    } finally {
      setLinkingUsername(false)
    }
  }

  if (!isLinked) {
    return (
      <div className="games-page">
        <div className="link-card">
          <div className="link-icon">&#x265F;&#xFE0F;</div>
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
            {linkError && <ErrorBanner message={linkError} />}
            <Button type="submit" loading={linkingUsername} disabled={!chessUsername.trim()} fullWidth>
              Connect Account
            </Button>
          </form>
          <div className="link-info">
            <p>We only access your public game data. Your password is never shared.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="games-page">
      <div className="games-header">
        <div>
          <h1>Games</h1>
          <p className="games-subtitle">
            Connected as <Badge variant="info">{user.chess_com_username}</Badge>
          </p>
        </div>
        <div className="games-actions">
          <Select
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            aria-label="Timeframe"
          />
          <Button
            onClick={() => fetchFromChessCom(timeframe)}
            loading={isFetchingChessCom}
            size="sm"
          >
            Fetch from Chess.com
          </Button>
          <Button variant="secondary" onClick={refresh} loading={isLoading} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {isLoading ? (
        <div className="games-loading">
          <Spinner size="lg" />
          <p>Fetching your games...</p>
        </div>
      ) : games.length === 0 ? (
        <EmptyState icon="&#x1F4ED;" message="No games found. Play some games on Chess.com and they'll appear here!" />
      ) : (
        <>
          <div className="games-list">
            {games.map((game, index) => {
              const result = getGameResult(game, user.chess_com_username)
              const opponent = getOpponent(game, user.chess_com_username)
              const isWhite = getIsWhite(game, user.chess_com_username)

              return (
                <div key={game.game_id || game.uuid || index} className="game-card">
                  <div className="game-main">
                    <div className="game-color">
                      <div className={`piece-indicator ${isWhite ? 'white-piece' : 'black-piece'}`}>
                        {isWhite ? '\u2654' : '\u265A'}
                      </div>
                    </div>
                    <div className="game-info">
                      <div className="opponent-row">
                        <span className="vs-text">vs</span>
                        <span className="opponent-name">{opponent?.username || 'Unknown'}</span>
                        <span className="opponent-rating">({opponent?.rating || '?'})</span>
                      </div>
                      <div className="game-meta">
                        <span className="time-control">{formatTimeControl(game.time_control)}</span>
                        <span className="separator">&bull;</span>
                        <span className="game-date">{formatDate(game.end_time)}</span>
                      </div>
                    </div>
                    <Badge variant={result.variant}>{result.text}</Badge>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/games/${game.game_id}`)}
                  >
                    Analyze
                  </Button>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                &larr; Previous
              </Button>
              <div className="page-info">
                Page {page} of {totalPages}
                <span className="total-games">({total} games)</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next &rarr;
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Games
