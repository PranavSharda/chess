import { useMemo } from 'react'
import { getIsWhite, getGameResult } from '../utils/chessHelpers'
import { formatDateShort } from '../utils/formatters'

const TIME_CONTROL_COLORS = {
  bullet: '#f97316',
  blitz: '#3b82f6',
  rapid: '#8b5cf6',
  classical: '#10b981',
}

const WLD_COLORS = {
  win: '#22c55e',
  loss: '#ef4444',
  draw: '#94a3b8',
}

function formatMonth(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function monthKey(ts) {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function useTrends(allGames, username, timeClassFilter) {
  const filtered = useMemo(() => {
    let games = allGames || []
    if (timeClassFilter && timeClassFilter !== 'all') {
      games = games.filter((g) => g.time_class === timeClassFilter)
    }
    return [...games].sort((a, b) => (a.end_time || 0) - (b.end_time || 0))
  }, [allGames, timeClassFilter])

  const ratingData = useMemo(() => {
    return filtered
      .map((g) => {
        const isWhite = getIsWhite(g, username)
        const rating = isWhite ? g.white_rating : g.black_rating
        if (!rating) return null
        return {
          date: g.end_time,
          rating,
          label: formatDateShort(g.end_time),
          timeClass: g.time_class,
        }
      })
      .filter(Boolean)
  }, [filtered, username])

  const wldData = useMemo(() => {
    const counts = { win: 0, loss: 0, draw: 0 }
    for (const g of filtered) {
      const { variant } = getGameResult(g, username)
      counts[variant] = (counts[variant] || 0) + 1
    }
    return [
      { name: 'Wins', value: counts.win, color: WLD_COLORS.win },
      { name: 'Losses', value: counts.loss, color: WLD_COLORS.loss },
      { name: 'Draws', value: counts.draw, color: WLD_COLORS.draw },
    ]
  }, [filtered, username])

  const analysedFiltered = useMemo(
    () => filtered.filter((g) => g.is_analysed),
    [filtered]
  )

  const accuracyData = useMemo(() => {
    return analysedFiltered
      .map((g) => {
        const isWhite = getIsWhite(g, username)
        const accuracy = isWhite ? g.white_accuracy : g.black_accuracy
        if (accuracy == null) return null
        return {
          date: g.end_time,
          accuracy: Math.round(accuracy * 10) / 10,
          label: formatDateShort(g.end_time),
        }
      })
      .filter(Boolean)
  }, [analysedFiltered, username])

  const blunderData = useMemo(() => {
    const buckets = {}
    for (const g of analysedFiltered) {
      if (g.user_blunder_count == null || !g.end_time) continue
      const key = monthKey(g.end_time)
      if (!buckets[key]) {
        buckets[key] = { month: formatMonth(g.end_time), totalBlunders: 0, totalGames: 0, sortKey: key }
      }
      buckets[key].totalBlunders += g.user_blunder_count
      buckets[key].totalGames += 1
    }
    return Object.values(buckets)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ month, totalBlunders, totalGames }) => ({
        month,
        avgBlunders: Math.round((totalBlunders / totalGames) * 10) / 10,
        totalGames,
      }))
  }, [analysedFiltered])

  const timeControlData = useMemo(() => {
    const counts = {}
    for (const g of filtered) {
      const tc = g.time_class || 'unknown'
      counts[tc] = (counts[tc] || 0) + 1
    }
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: TIME_CONTROL_COLORS[name] || '#6b7280',
    }))
  }, [filtered])

  const totalGames = filtered.length
  const analysedGames = analysedFiltered.length

  return {
    ratingData,
    wldData,
    accuracyData,
    blunderData,
    timeControlData,
    totalGames,
    analysedGames,
    hasPartialAnalysis: analysedGames > 0 && analysedGames < totalGames,
    isEmpty: totalGames === 0,
  }
}
