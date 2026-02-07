import React from 'react'
import './Logo.css'

function Logo({ className = '' }) {
  return (
    <div className={`logo-container ${className}`}>
      <svg 
        className="logo-svg" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bishopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        
        {/* Bishop base */}
        <circle cx="50" cy="88" r="6" fill="url(#bishopGradient)"/>
        
        {/* Bishop stem */}
        <rect x="44" y="70" width="12" height="18" rx="1.5" fill="url(#bishopGradient)"/>
        
        {/* Bishop body */}
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
          fill="url(#bishopGradient)"
        />
        
        {/* Bishop top/cross */}
        <circle cx="50" cy="25" r="3.5" fill="url(#bishopGradient)"/>
        <rect x="48.5" y="15" width="3" height="10" rx="1" fill="url(#bishopGradient)"/>
      </svg>
      <span className="logo-text">Chess Vector</span>
    </div>
  )
}

export default Logo
