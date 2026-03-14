import React from 'react'
import './Card.css'

function Card({ children, title, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  )
}

export default Card
