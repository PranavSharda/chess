import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/dashboard', icon: '~', label: 'Dashboard' },
  { to: '/games', icon: '~', label: 'Games' },
  { to: '/trends', icon: '~', label: 'Trends' },
  { to: '/puzzles', icon: '~', label: 'Puzzles' },
  { to: '/coach', icon: '~', label: 'Coach' },
]

function Sidebar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/signin')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-logo">Chess Vector</span>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-action" onClick={toggleTheme}>
          <span className="sidebar-action-icon">{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
        </button>
        {user && (
          <div className="sidebar-user">
            <span className="sidebar-username">{user.username}</span>
          </div>
        )}
        <button className="sidebar-action sidebar-logout" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
