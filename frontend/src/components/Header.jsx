import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import Logo from './Logo'
import './Header.css'

function Header({ user, onLogout }) {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    onLogout()
    navigate('/signin')
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <Logo />
        </Link>
        
        <nav className="nav">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <span className="theme-icon">🌙</span>
            ) : (
              <span className="theme-icon">☀️</span>
            )}
          </button>
          
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/analysis" className="nav-link">Analysis</Link>
              <div className="user-menu">
                <span className="user-name">{user?.username ?? ''}</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </>
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

