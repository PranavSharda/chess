import React from 'react'
import './Input.css'

function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <input id={inputId} className="input-field" {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
}

export default Input
