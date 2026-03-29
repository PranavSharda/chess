import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AnalysisQueueProvider } from './contexts/AnalysisQueueContext'
import PublicLayout from './layouts/PublicLayout'
import AppShell from './layouts/AppShell'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import Games from './pages/Games'
import GameAnalysis from './pages/GameAnalysis'
import Trends from './pages/Trends'
import Puzzles from './pages/Puzzles'
import PuzzleSolver from './pages/PuzzleSolver'
import Coach from './pages/Coach'
import Spinner from './components/ui/Spinner'

function AuthRedirect({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spinner size="lg" /></div>
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AnalysisQueueProvider>
        <Router>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<AuthRedirect><SignIn /></AuthRedirect>} />
              <Route path="/signup" element={<AuthRedirect><SignUp /></AuthRedirect>} />
            </Route>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/games/:gameId" element={<GameAnalysis />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/puzzles" element={<Puzzles />} />
              <Route path="/puzzles/:puzzleId" element={<PuzzleSolver />} />
              <Route path="/coach" element={<Coach />} />
            </Route>
          </Routes>
        </Router>
        </AnalysisQueueProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
