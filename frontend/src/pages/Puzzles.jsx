import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import ErrorBanner from '../components/ui/ErrorBanner'
import { generatePuzzles } from '../services/puzzles'
import usePuzzles from '../hooks/usePuzzles'
import './Puzzles.css'

function PuzzleCard({ puzzle }) {
  const navigate = useNavigate()
  const tags = puzzle.normalized_tags?.length ? puzzle.normalized_tags : (puzzle.raw_tags || [])
  const canSolve = !!puzzle.start_fen && (puzzle.solution_uci || []).length >= 2

  return (
    <Card className="puzzle-card">
      <div className="puzzle-card-header">
        <div>
          <div className="puzzle-card-title">Punish the Blunder</div>
          <div className="puzzle-card-subtitle">
            Move index {puzzle.source_half_move_index}
          </div>
        </div>
        <Badge variant="info">{puzzle.status || 'candidate'}</Badge>
      </div>

      <div className="puzzle-line">
        <span className="puzzle-line-label">Opponent played</span>
        <strong>{puzzle.played_move}</strong>
        {puzzle.best_move && (
          <>
            <span className="puzzle-line-separator">&rarr;</span>
            <span className="puzzle-line-label">instead of</span>
            <strong>{puzzle.best_move}</strong>
          </>
        )}
      </div>

      {typeof puzzle.cp === 'number' && (
        <div className="puzzle-meta">Your advantage: {puzzle.cp >= 0 ? '+' : ''}{(puzzle.cp / 100).toFixed(1)}</div>
      )}

      {tags.length > 0 ? (
        <div className="puzzle-tags">
          {tags.map((tag) => (
            <Badge key={tag} variant="info" className="puzzle-tag">{tag}</Badge>
          ))}
        </div>
      ) : (
        <div className="puzzle-meta">No tags stored yet</div>
      )}

      <div className="puzzle-card-actions">
        <Button
          size="sm"
          disabled={!canSolve}
          onClick={() => navigate(`/puzzles/${puzzle.puzzle_id}`)}
        >
          {canSolve ? 'Solve Puzzle' : 'Solver Unavailable'}
        </Button>
      </div>
    </Card>
  )
}

function Puzzles() {
  const { puzzles, total, isLoading, error, refresh } = usePuzzles()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [generationSummary, setGenerationSummary] = useState('')
  const classified = puzzles.filter((p) => (p.raw_tags || []).length > 0 || (p.normalized_tags || []).length > 0).length
  const candidates = puzzles.filter((p) => p.status === 'candidate').length
  const rejected = puzzles.filter((p) => p.status === 'rejected').length

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGenerationError('')
    setGenerationSummary('')

    try {
      const result = await generatePuzzles()
      if (!result.total) {
        setGenerationSummary('No analysed games are ready yet. Analyse a few games first, then generate puzzles here.')
      } else {
        const parts = [
          `Generated ${result.generated} puzzle candidate${result.generated === 1 ? '' : 's'} from ${result.total} analysed game${result.total === 1 ? '' : 's'}.`,
        ]
        if (result.skipped) {
          parts.push(`Skipped ${result.skipped} game${result.skipped === 1 ? '' : 's'} without a clear tactical candidate.`)
        }
        if (result.failed) {
          parts.push(`${result.failed} game${result.failed === 1 ? ' failed' : 's failed'} during classification.`)
        }
        setGenerationSummary(parts.join(' '))
      }
      await refresh()
    } catch (err) {
      setGenerationError(err.response?.data?.detail || err.message || 'Failed to generate puzzle candidates')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="puzzles-page">
      <h1 className="page-title">Puzzles</h1>
      <p className="page-subtitle">Practice tactics extracted from your own games</p>

      <div className="puzzles-stats">
        <Card className="stat-card"><div className="stat-value">{total}</div><div className="stat-label">Total</div></Card>
        <Card className="stat-card"><div className="stat-value">{classified}</div><div className="stat-label">Tagged</div></Card>
        <Card className="stat-card"><div className="stat-value">{candidates}</div><div className="stat-label">Candidates</div></Card>
        <Card className="stat-card"><div className="stat-value">{rejected}</div><div className="stat-label">Rejected</div></Card>
      </div>

      <div className="puzzles-toolbar">
        <Button onClick={handleGenerate} loading={isGenerating}>
          Generate From Analysed Games
        </Button>
        <Button variant="secondary" onClick={refresh} loading={isLoading}>Refresh</Button>
      </div>

      {error && <ErrorBanner message={error} />}
      {generationError && <ErrorBanner message={generationError} />}
      {generationSummary && <div className="puzzles-summary">{generationSummary}</div>}

      {isLoading ? (
        <div className="puzzles-loading">
          <Spinner size="lg" />
          <p>Loading stored puzzle candidates...</p>
        </div>
      ) : puzzles.length === 0 ? (
        <EmptyState
          icon="&#x1F9E9;"
          message="No puzzle candidates yet. Use Generate From Analysed Games to populate this list from your stored analysis."
        />
      ) : (
        <div className="puzzles-grid">
          {puzzles.map((puzzle) => (
            <PuzzleCard key={puzzle.puzzle_id || `${puzzle.game_id}-${puzzle.source_half_move_index}`} puzzle={puzzle} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Puzzles
