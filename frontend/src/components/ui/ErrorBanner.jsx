import React, { useState } from 'react'
import './ErrorBanner.css'

function ErrorBanner({ message, onDismiss }) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !message) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="error-banner">
      <span className="error-banner-message">{message}</span>
      <button className="error-banner-close" onClick={handleDismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  )
}

export default ErrorBanner
