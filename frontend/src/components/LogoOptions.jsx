import React, { useState } from 'react'
import './LogoOptions.css'

// Option 1: Simple chess piece with vector lines
function LogoOption1() {
  return (
    <div className="logo-option">
      <h3>Option 1: Chess Piece + Vector Lines</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        {/* Chess piece */}
        <circle cx="50" cy="80" r="6" fill="currentColor"/>
        <rect x="46" y="60" width="8" height="20" rx="1" fill="currentColor"/>
        <path d="M 50 20 L 40 40 Q 40 45 42 47 L 42 60 L 58 60 L 58 47 Q 60 45 60 40 Z" fill="currentColor"/>
        {/* Vector lines */}
        <line x1="70" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <line x1="30" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)"/>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="currentColor"/>
          </marker>
        </defs>
      </svg>
    </div>
  )
}

// Option 2: Abstract CV monogram
function LogoOption2() {
  return (
    <div className="logo-option">
      <h3>Option 2: CV Monogram</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        {/* C shape */}
        <path d="M 30 30 Q 20 30 20 50 Q 20 70 30 70" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"/>
        {/* V shape with chess square pattern */}
        <path d="M 50 30 L 70 70 M 50 30 L 30 70" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <rect x="45" y="45" width="10" height="10" fill="currentColor" opacity="0.3"/>
      </svg>
    </div>
  )
}

// Option 3: Chess board with arrow
function LogoOption3() {
  return (
    <div className="logo-option">
      <h3>Option 3: Chess Board + Direction</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        {/* Mini chess board */}
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="2"/>
        <rect x="25" y="25" width="25" height="25" fill="currentColor" opacity="0.2"/>
        <rect x="50" y="50" width="25" height="25" fill="currentColor" opacity="0.2"/>
        {/* Arrow */}
        <path d="M 80 50 L 90 50 M 85 45 L 90 50 L 85 55" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

// Option 4: Stylized chess piece (simpler)
function LogoOption4() {
  return (
    <div className="logo-option">
      <h3>Option 4: Clean Chess Piece</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        <circle cx="50" cy="85" r="7" fill="currentColor"/>
        <rect x="45" y="60" width="10" height="25" rx="2" fill="currentColor"/>
        <path d="M 50 15 L 38 40 Q 38 45 40 47 L 40 60 L 60 60 L 60 47 Q 62 45 62 40 Z" fill="currentColor"/>
        <circle cx="50" cy="30" r="4" fill="var(--bg-primary)"/>
      </svg>
    </div>
  )
}

// Option 5: Geometric/Abstract
function LogoOption5() {
  return (
    <div className="logo-option">
      <h3>Option 5: Geometric Vector</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        {/* Chess square */}
        <rect x="30" y="30" width="20" height="20" fill="currentColor" opacity="0.8"/>
        {/* Vector arrow */}
        <path d="M 55 40 L 75 40 L 70 35 M 75 40 L 70 45" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
        <path d="M 40 55 L 40 75 L 35 70 M 40 75 L 45 70" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// Option 6: Bishop (Current)
function LogoOption6() {
  return (
    <div className="logo-option">
      <h3>Option 6: Bishop (Current)</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        <defs>
          <linearGradient id="bishopGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="88" r="6" fill="url(#bishopGrad)"/>
        <rect x="44" y="70" width="12" height="18" rx="1.5" fill="url(#bishopGrad)"/>
        <path 
          d="M 50 20
             L 42 35
             Q 42 40 44 42
             L 44 50
             Q 44 55 47 58
             L 47 70
             L 53 70
             L 53 58
             Q 56 55 56 50
             L 56 42
             Q 58 40 58 35
             Z" 
          fill="url(#bishopGrad)"
        />
        <circle cx="50" cy="25" r="3.5" fill="url(#bishopGrad)"/>
        <rect x="48.5" y="15" width="3" height="10" rx="1" fill="url(#bishopGrad)"/>
        <g opacity="0.4">
          <line x1="65" y1="35" x2="75" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="35" y1="35" x2="25" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </g>
      </svg>
    </div>
  )
}

// Option 7: Bishop Outline Style
function LogoOption7() {
  return (
    <div className="logo-option">
      <h3>Option 7: Bishop Outline</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        <path 
          d="M 50 15
             L 42 30
             Q 42 35 44 37
             L 44 45
             Q 44 50 47 53
             L 47 65
             L 53 65
             L 53 53
             Q 56 50 56 45
             L 56 37
             Q 58 35 58 30
             Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <circle cx="50" cy="20" r="3" fill="currentColor"/>
        <rect x="48" y="10" width="4" height="8" rx="1" fill="currentColor"/>
        <circle cx="50" cy="85" r="5" fill="none" stroke="currentColor" strokeWidth="3"/>
      </svg>
    </div>
  )
}

// Option 8: Bishop with Vector Arrow
function LogoOption8() {
  return (
    <div className="logo-option">
      <h3>Option 8: Bishop + Vector</h3>
      <svg viewBox="0 0 100 100" className="logo-preview">
        <circle cx="50" cy="88" r="5" fill="currentColor"/>
        <rect x="45" y="70" width="10" height="18" rx="1" fill="currentColor"/>
        <path 
          d="M 50 20
             L 43 35
             Q 43 40 45 42
             L 45 50
             Q 45 55 48 58
             L 48 70
             L 52 70
             L 52 58
             Q 55 55 55 50
             L 55 42
             Q 57 40 57 35
             Z" 
          fill="currentColor"
        />
        <circle cx="50" cy="25" r="3" fill="currentColor"/>
        <rect x="48.5" y="15" width="3" height="10" rx="1" fill="currentColor"/>
        {/* Vector arrow */}
        <path d="M 70 50 L 82 50 M 77 45 L 82 50 L 77 55" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      </svg>
    </div>
  )
}

function LogoOptions() {
  const [selected, setSelected] = useState(null)

  const options = [
    { id: 1, component: LogoOption1 },
    { id: 2, component: LogoOption2 },
    { id: 3, component: LogoOption3 },
    { id: 4, component: LogoOption4 },
    { id: 5, component: LogoOption5 },
    { id: 6, component: LogoOption6 },
    { id: 7, component: LogoOption7 },
    { id: 8, component: LogoOption8 },
  ]

  return (
    <div className="logo-options-container">
      <h2>Choose a Logo Design</h2>
      <div className="logo-grid">
        {options.map(({ id, component: Component }) => (
          <div 
            key={id} 
            className={`logo-option-wrapper ${selected === id ? 'selected' : ''}`}
            onClick={() => setSelected(id)}
          >
            <Component />
            {selected === id && <div className="checkmark">✓</div>}
          </div>
        ))}
      </div>
      {selected && (
        <div className="selected-info">
          <p>You selected Option {selected}</p>
          <p className="hint">Tell me which one you like and I'll implement it!</p>
        </div>
      )}
    </div>
  )
}

export default LogoOptions

