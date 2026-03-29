import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from '../components/navigation/Sidebar'
import Spinner from '../components/ui/Spinner'
import AnalysisProgress from '../components/ui/AnalysisProgress'
import './AppShell.css'

function AppShell() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="appshell-loading">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />
  }

  return (
    <div className="appshell">
      <Sidebar />
      <main className="appshell-main">
        <AnalysisProgress />
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
