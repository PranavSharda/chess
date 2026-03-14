import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getToken, decodeToken, isTokenExpired, removeToken } from '../services/api'
import { getMe } from '../services/auth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const claims = decodeToken()
    if (!claims?.sub) return null
    return { id: claims.sub }
  })
  const [isLoading, setIsLoading] = useState(() => !!getToken())

  useEffect(() => {
    const validateToken = async () => {
      const token = getToken()
      if (!token) {
        setIsLoading(false)
        return
      }
      if (isTokenExpired()) {
        removeToken()
        setUser(null)
        setIsLoading(false)
        return
      }
      try {
        const freshUser = await getMe()
        setUser(freshUser)
      } catch {
        removeToken()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    validateToken()
  }, [])

  const login = useCallback((userData) => {
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUser(null)
  }, [])

  const updateUser = useCallback((data) => {
    setUser((prev) => ({ ...prev, ...data }))
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
