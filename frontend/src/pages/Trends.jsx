import React from 'react'
import Card from '../components/ui/Card'
import './Trends.css'

function Trends() {
  return (
    <div className="trends-page">
      <h1 className="page-title">Trends</h1>
      <p className="page-subtitle">Track your chess performance over time</p>

      <div className="trends-grid">
        <Card title="Rating Over Time" className="trend-card">
          <div className="coming-soon">
            <span className="coming-soon-icon">&#x1F4C8;</span>
            <p>Rating chart coming soon</p>
          </div>
        </Card>
        <Card title="Win / Loss / Draw" className="trend-card">
          <div className="coming-soon">
            <span className="coming-soon-icon">&#x1F4CA;</span>
            <p>Win/loss breakdown coming soon</p>
          </div>
        </Card>
        <Card title="Accuracy" className="trend-card">
          <div className="coming-soon">
            <span className="coming-soon-icon">&#x1F3AF;</span>
            <p>Accuracy trends coming soon</p>
          </div>
        </Card>
        <Card title="Blunder Frequency" className="trend-card">
          <div className="coming-soon">
            <span className="coming-soon-icon">&#x26A0;&#xFE0F;</span>
            <p>Blunder tracking coming soon</p>
          </div>
        </Card>
        <Card title="Time Controls" className="trend-card">
          <div className="coming-soon">
            <span className="coming-soon-icon">&#x23F1;&#xFE0F;</span>
            <p>Time control breakdown coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Trends
