import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Chessboard } from 'react-chessboard'
import { useAuth } from '../contexts/AuthContext'
import useTrends from '../hooks/useTrends'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import './Trends.css'

const TIMEFRAME_OPTIONS = [
  { value: '', label: 'Select timeframe' },
  { value: '3_months', label: 'Last 3 Months' },
  { value: '1_year', label: 'Last Year' },
  { value: '5_years', label: 'Last 5 Years' },
  { value: '10_years', label: 'Last 10 Years' },
]

const TIME_CLASS_OPTIONS = [
  { value: '', label: 'All Formats' },
  { value: 'rapid', label: 'Rapid' },
  { value: 'blitz', label: 'Blitz' },
  { value: 'bullet', label: 'Bullet' },
]

function MistakeCard({ mistake }) {
  return (
    <Card className="mistake-card">
      <div className="mistake-board">
        <Chessboard
          position={mistake.fen}
          boardWidth={180}
          arePiecesDraggable={false}
          animationDuration={0}
          customBoardStyle={{ borderRadius: '2px' }}
          customDarkSquareStyle={{ backgroundColor: '#779952' }}
          customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        />
      </div>
      <div className="mistake-info">
        <div className="mistake-count">{mistake.count}x</div>
        <div className="mistake-moves">
          <div className="mistake-played">
            Played: <strong>{mistake.played_move}</strong>
          </div>
          {mistake.best_move && (
            <div className="mistake-best">
              Best: <strong>{mistake.best_move}</strong>
            </div>
          )}
        </div>
        <div className="mistake-wc-loss">
          Avg win% loss: {(mistake.avg_wc_loss * 100).toFixed(1)}%
        </div>
        {mistake.games?.[0] && (
          <Link
            to={`/games/${mistake.games[0].game_id}?move=${mistake.games[0].half_move_index - 1}`}
            className="mistake-analyse-link"
          >
            Analyse
          </Link>
        )}
      </div>
    </Card>
  )
}

function MistakeSection({ title, subtitle, mistakes }) {
  return (
    <div className="mistake-section">
      <h2 className="mistake-section-title">{title}</h2>
      {subtitle && <p className="mistake-section-subtitle">{subtitle}</p>}
      {mistakes.length === 0 ? (
        <p className="trend-empty">No repeated mistakes found</p>
      ) : (
        <div className="mistakes-grid">
          {mistakes.map((m, i) => (
            <MistakeCard key={`${m.fen}-${i}`} mistake={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProgressState({ step, STEPS, gameStats, analysisProgress, error }) {
  if (step === STEPS.IMPORTING) {
    return (
      <div className="trends-progress">
        <Spinner size="md" />
        <p>Importing games from Chess.com...</p>
      </div>
    )
  }

  if (step === STEPS.ANALYSING) {
    const pct = analysisProgress.total > 0
      ? Math.round((analysisProgress.completed / analysisProgress.total) * 100)
      : 0
    return (
      <div className="trends-progress">
        <Spinner size="md" />
        <p>Analysing {gameStats.unanalysed} games with Stockfish...</p>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="progress-text">{analysisProgress.completed} / {analysisProgress.total} ({pct}%)</p>
      </div>
    )
  }

  if (step === STEPS.COMPUTING) {
    return (
      <div className="trends-progress">
        <Spinner size="md" />
        <p>Computing common mistakes...</p>
      </div>
    )
  }

  if (step === STEPS.ERROR) {
    return (
      <div className="trends-progress trends-error">
        <p>{error || 'Something went wrong'}</p>
      </div>
    )
  }

  return null
}

function Trends() {
  const { user } = useAuth()
  const isLinked = !!user?.chess_com_username
  const [timeframe, setTimeframe] = useState('')
  const [timeClass, setTimeClass] = useState('')

  const {
    step, STEPS, openingMistakes, endgameMistakes,
    totalAnalysed, gameStats, analysisProgress, error, isEmpty,
  } = useTrends(timeframe, timeClass)

  return (
    <div className="trends-page">
      <div className="trends-header">
        <div>
          <h1 className="page-title">Common Mistakes</h1>
          <p className="page-subtitle">
            {step === STEPS.DONE
              ? `Based on ${totalAnalysed} analysed games`
              : 'Find patterns in your opening and endgame play'}
          </p>
        </div>
        <div className="trends-filters">
          <Select
            className="trends-filter"
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            disabled={!isLinked}
            aria-label="Timeframe"
          />
          <Select
            className="trends-filter"
            options={TIME_CLASS_OPTIONS}
            value={timeClass}
            onChange={(e) => setTimeClass(e.target.value)}
            disabled={!isLinked}
            aria-label="Format"
          />
        </div>
      </div>

      {!isLinked && (
        <div className="trend-empty">
          Link your Chess.com account to get started.
        </div>
      )}

      {step !== STEPS.IDLE && step !== STEPS.DONE && (
        <ProgressState
          step={step}
          STEPS={STEPS}
          gameStats={gameStats}
          analysisProgress={analysisProgress}
          error={error}
        />
      )}

      {isLinked && step === STEPS.IDLE && (
        <div className="trend-empty">
          Select a timeframe to start trend analysis.
        </div>
      )}

      {step === STEPS.DONE && isEmpty && (
        <div className="trend-empty">
          No repeated mistakes found for these filters. Try a longer window, another format, or analyse more games.
        </div>
      )}

      {step === STEPS.DONE && !isEmpty && (
        <>
          <MistakeSection
            title="Opening Mistakes"
            subtitle="First 12 moves — positions where you repeatedly lose winning chances"
            mistakes={openingMistakes}
          />
          <MistakeSection
            title="Endgame Mistakes"
            subtitle="Last 20 moves — positions where you repeatedly lose significant material"
            mistakes={endgameMistakes}
          />
        </>
      )}
    </div>
  )
}

export default Trends
