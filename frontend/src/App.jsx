import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Header from './components/Header'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Analysis from './pages/Analysis'
import AnalyzeGame from './pages/AnalyzeGame'
import { logout as apiLogout, getToken, getMe, decodeToken, isTokenExpired } from './services/api'
import './App.css'

function App() {
  // Optimistic initial state: decode JWT for user id only; full profile from getMe()
  const [user, setUser] = useState(() => {
    const claims = decodeToken()
    if (!claims?.sub) return null
    return { id: claims.sub }
  })
  const [validating, setValidating] = useState(() => !!getToken())

  // Validate token (expiry + backend) and fetch full user profile on app load
  useEffect(() => {
    const validateToken = async () => {
      const token = getToken()
      if (!token) {
        setValidating(false)
        return
      }
      if (isTokenExpired()) {
        apiLogout()
        setUser(null)
        setValidating(false)
        return
      }
      try {
        const freshUser = await getMe()
        setUser(freshUser)
      } catch {
        // Token invalid (e.g. revoked) — force logout
        apiLogout()
        setUser(null)
      } finally {
        setValidating(false)
      }
    }
    validateToken()
  }, [])

  const handleLogin = (userData) => {
    // Token is already saved by api.js signIn / signUp helpers
    setUser(userData)
  }

  const handleLogout = () => {
    apiLogout()
    setUser(null)
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser)
  }

  if (validating) {
    return (
      <ThemeProvider>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading...</p>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <Router>
        <Header user={user} onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Home />} />
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
