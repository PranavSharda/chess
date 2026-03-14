import React from 'react'
import './Button.css'

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {children}
    </button>
  )
}

export default Button
