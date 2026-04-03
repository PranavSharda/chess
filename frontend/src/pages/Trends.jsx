import React, { useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import useGames from '../hooks/useGames'
import useTrends from '../hooks/useTrends'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { formatDateShort } from '../utils/formatters'
import './Trends.css'

const TIME_CLASS_OPTIONS = [
  { value: 'all', label: 'All Time Controls' },
  { value: 'rapid', label: 'Rapid' },
  { value: 'blitz', label: 'Blitz' },
  { value: 'bullet', label: 'Bullet' },
]

const CHART_HEIGHT = 280

function TrendEmpty({ text }) {
  return <div className="trend-empty">{text}</div>
}

function Trends() {
  const { user } = useAuth()
  const isLinked = !!user?.chess_com_username
  const { allGames, isLoading } = useGames(isLinked)
  const [timeClassFilter, setTimeClassFilter] = useState('all')

  const {
    ratingData, wldData, accuracyData, blunderData,
    timeControlData, totalGames, hasPartialAnalysis, analysedGames, isEmpty,
  } = useTrends(allGames, user?.chess_com_username, timeClassFilter)

  if (isLoading) {
    return (
      <div className="trends-page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="trends-page">
      <div className="trends-header">
        <div>
          <h1 className="page-title">Trends</h1>
          <p className="page-subtitle">
            {isEmpty
              ? 'Import games to see your trends'
              : `Tracking ${totalGames} games`}
          </p>
        </div>
        <Select
          className="trends-filter"
          options={TIME_CLASS_OPTIONS}
          value={timeClassFilter}
          onChange={(e) => setTimeClassFilter(e.target.value)}
        />
      </div>

      {isEmpty ? (
        <TrendEmpty text={
          timeClassFilter !== 'all'
            ? `No ${timeClassFilter} games found`
            : 'No games imported yet. Fetch games from Chess.com to see trends.'
        } />
      ) : (
        <div className="trends-grid">
          {/* Rating Over Time */}
          <Card title="Rating Over Time" className="trend-card trend-card--wide">
            {ratingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(ts) => formatDateShort(ts)}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis
                    domain={['dataMin - 50', 'dataMax + 50']}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <Tooltip
                    labelFormatter={(ts) => formatDateShort(ts)}
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                  />
                  <Line
                    type="monotone" dataKey="rating" name="Rating"
                    stroke="#059669" strokeWidth={2}
                    dot={false} activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <TrendEmpty text="No rating data available" />
            )}
          </Card>

          {/* Win / Loss / Draw */}
          <Card title="Win / Loss / Draw" className="trend-card">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={wldData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {wldData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Time Controls */}
          <Card title="Time Controls" className="trend-card">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <PieChart>
                <Pie
                  data={timeControlData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={50} outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={false}
                >
                  {timeControlData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Accuracy */}
          <Card title="Accuracy" className="trend-card trend-card--wide">
            {hasPartialAnalysis && (
              <p className="trend-notice">
                Based on {analysedGames} of {totalGames} games analysed
              </p>
            )}
            {accuracyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <AreaChart data={accuracyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(ts) => formatDateShort(ts)}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    stroke="#888"
                  />
                  <Tooltip
                    labelFormatter={(ts) => formatDateShort(ts)}
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                  />
                  <Area
                    type="monotone" dataKey="accuracy" name="Accuracy %"
                    stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15}
                    strokeWidth={2} dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <TrendEmpty text="No analysed games yet" />
            )}
          </Card>

          {/* Blunder Frequency */}
          <Card title="Blunder Frequency" className="trend-card trend-card--wide">
            {hasPartialAnalysis && (
              <p className="trend-notice">
                Based on {analysedGames} of {totalGames} games analysed
              </p>
            )}
            {blunderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={blunderData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#888" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#888" />
                  <Tooltip
                    contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }}
                  />
                  <Bar
                    dataKey="avgBlunders" name="Avg Blunders/Game"
                    fill="#ef4444" radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <TrendEmpty text="No analysed games yet" />
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default Trends
