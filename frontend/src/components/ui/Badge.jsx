import React from 'react'
import './Badge.css'

function Badge({ children, variant = 'info', className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
