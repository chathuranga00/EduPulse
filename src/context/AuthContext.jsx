import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { API_BASE } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading]   = useState(true)
  const channelRef              = useRef(null)

  // ── Fetch current session on mount ────────────────────────────────────────
  useEffect(() => {
    fetch(API_BASE + '/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) { setUser(data.user); setSettings(data.settings) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ── Real-time: sync user profile & settings across tabs/devices ──────────
  useEffect(() => {
    if (!user?.id) return

    // Clean up previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase
      .channel(`auth-user-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'users',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        // strip password before setting
        const { password: _pw, ...safeUser } = payload.new
        setUser(safeUser)
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'user_settings',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setSettings(payload.new)
      })
      .subscribe()

    channelRef.current = ch
    return () => supabase.removeChannel(ch)
  }, [user?.id])

  // ── Actions ───────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const res  = await fetch(API_BASE + '/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setUser(data.user)
    const sr = await fetch(API_BASE + '/api/auth/me')
    if (sr.ok) { const sd = await sr.json(); setSettings(sd.settings) }
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res  = await fetch(API_BASE + '/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    setUser(data.user)
    const sr = await fetch(API_BASE + '/api/auth/me')
    if (sr.ok) { const sd = await sr.json(); setSettings(sd.settings) }
    return data.user
  }, [])

  const logout = useCallback(async () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    await fetch(API_BASE + '/api/auth/logout', { method: 'POST' })
    setUser(null)
    setSettings(null)
  }, [])

  const updateProfile = useCallback(async (fields) => {
    const res  = await fetch(API_BASE + '/api/users/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update profile')
    setUser(data.user)
    return data.user
  }, [])

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const res  = await fetch(API_BASE + '/api/users/password', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to change password')
  }, [])

  const updateSettings = useCallback(async (newSettings) => {
    const res  = await fetch(API_BASE + '/api/users/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update settings')
    setSettings(data.settings)
    return data.settings
  }, [])

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <AuthContext.Provider value={{
      user, settings, loading, initials,
      login, register, logout,
      updateProfile, changePassword, updateSettings,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
