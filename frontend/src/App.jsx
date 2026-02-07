import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import AnalyzeGame from './pages/AnalyzeGame'
import LogoOptions from './components/LogoOptions'
import { logout as apiLogout, getToken } from './services/api'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    // Only consider user logged-in if both token and user data exist
    const token = getToken()
    const stored = localStorage.getItem('user')
    if (token && stored) {
      return JSON.parse(stored)
    }
    return null
  })

  const handleLogin = (userData) => {
    // Token is already saved by api.js signIn / signUp helpers
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    apiLogout()
    setUser(null)
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <ThemeProvider>
      <Router>
        <Header user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/logo-options" element={<LogoOptions />} />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/dashboard" /> : <SignUp onLogin={handleLogin} />} 
          />
          <Route 
            path="/signin" 
            element={user ? <Navigate to="/dashboard" /> : <SignIn onLogin={handleLogin} />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/signin" />} 
          />
          <Route 
            path="/analysis" 
            element={user ? <Analysis user={user} onUserUpdate={handleUserUpdate} /> : <Navigate to="/signin" />} 
          />
          <Route 
            path="/analyze-game" 
            element={user ? <AnalyzeGame user={user} /> : <Navigate to="/signin" />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

