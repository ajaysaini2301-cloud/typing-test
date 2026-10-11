import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await api.getCurrentUser()
        if (!cancelled) setUser(data.user)
      } catch {
        localStorage.removeItem('access_token')
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkSession()

    return () => {
      cancelled = true
    }
  }, [])

  async function login(credentials) {
    const data = await api.login(credentials)
    setUser(data.user)
    return data
  }

  async function register(details) {
    return api.register(details)
  }

  function logout() {
    api.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}