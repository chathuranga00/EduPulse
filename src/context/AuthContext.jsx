import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true) // true until /me resolves

  // ── Fetch current session on mount ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) { setUser(data.user); setSettings(data.settings) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setUser(data.user)
    // fetch settings after login
    const sr = await fetch('/api/auth/me')
    if (sr.ok) { const sd = await sr.json(); setSettings(sd.settings) }
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    setUser(data.user)
    const sr = await fetch('/api/auth/me')
    if (sr.ok) { const sd = await sr.json(); setSettings(sd.settings) }
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setSettings(null)
  }, [])

  const updateProfile = useCallback(async (fields) => {
    const res  = await fetch('/api/users/profile', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(fields),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update profile')
    setUser(data.user)
    return data.user
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res  = await fetch('/api/users/password', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to change password')
  }, [])

  const updateSettings = useCallback(async (newSettings) => {
    const res  = await fetch('/api/users/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(newSettings),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update settings')
    setSettings(data.settings)
    return data.settings
  }, [])

  // user initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <AuthContext.Provider value={{ user, settings, loading, initials, login, register, logout, updateProfile, changePassword, updateSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
