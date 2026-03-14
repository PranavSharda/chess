import React from 'react'
import './EmptyState.css'

function EmptyState({ icon, message, children }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-message">{message}</p>
      {children && <div className="empty-state-action">{children}</div>}
    </div>
  )
}

export default EmptyState
