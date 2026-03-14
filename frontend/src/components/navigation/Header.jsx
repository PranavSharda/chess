import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import Logo from './Logo'
import './Header.css'

function Header() {
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <Logo />
        </Link>
        <nav className="nav">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className="theme-icon">{theme === 'light' ? '\u{1F319}' : '\u{2600}\u{FE0F}'}</span>
          </button>
          {isAuthenticated ? (
            <Link to="/dashboard" className="nav-link nav-link-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/signin" className="nav-link">Sign In</Link>
              <Link to="/signup" className="nav-link nav-link-primary">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
