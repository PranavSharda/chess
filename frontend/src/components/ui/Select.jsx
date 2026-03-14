import React from 'react'
import './Select.css'

function Select({ label, options = [], error, className = '', id, ...props }) {
  const selectId = id || props.name
  return (
    <div className={`select-group ${error ? 'select-error' : ''} ${className}`}>
      {label && <label htmlFor={selectId} className="select-label">{label}</label>}
      <select id={selectId} className="select-field" {...props}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  )
}

export default Select
