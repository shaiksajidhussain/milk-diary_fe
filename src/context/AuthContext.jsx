import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

const STORAGE_KEY = 'dairy_auth_user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  const login = useCallback(async (email, password) => {
    if (!email?.trim() || !password) {
      throw new Error('Enter email and password')
    }
    // authApi.login returns { token, admin: { id, name, email } }
    const data = await authApi.login(email.trim(), password)
    const stored = {
      id: data.admin.id,
      name: data.admin.name,
      email: data.admin.email,
      token: data.token,
    }
    setUser(stored)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    return stored
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
