import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, X, Check, CheckCheck, Trophy, Users,
  CalendarDays, Info, ClipboardList,
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthContext.jsx'

// ── Icon per notification type ────────────────────────────────────────────────
function typeIcon(type) {
  switch (type) {
    case 'quiz_result':     return <Trophy className="h-4 w-4 text-amber-500" />
    case 'community_post':  return <Users className="h-4 w-4 text-violet-500" />
    case 'study_reminder':  return <CalendarDays className="h-4 w-4 text-emerald-500" />
    case 'system':          return <Info className="h-4 w-4 text-sky-500" />
    default:                return <ClipboardList className="h-4 w-4 text-primary" />
  }
}

function typeBg(type) {
  switch (type) {
    case 'quiz_result':    return 'bg-amber-50 dark:bg-amber-900/20'
    case 'community_post': return 'bg-violet-50 dark:bg-violet-900/20'
    case 'study_reminder': return 'bg-emerald-50 dark:bg-emerald-900/20'
    case 'system':         return 'bg-sky-50 dark:bg-sky-900/20'
    default:               return 'bg-indigo-50 dark:bg-indigo-900/20'
  }
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString()
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NotificationBell() {
  const { user }       = useAuth()
  const navigate       = useNavigate()
  const [open, setOpen]         = useState(false)
  const [notifs, setNotifs]     = useState([])
  const [loading, setLoading]   = useState(false)
  const panelRef = useRef(null)

  const unread = notifs.filter((n) => !n.read).length

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Initial load ──────────────────────────────────────────────────────────
  const loadNotifs = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifs(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { loadNotifs() }, [loadNotifs])

  // ── Real-time new notifications ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifs((prev) => [payload.new, ...prev].slice(0, 30))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [user])

  // ── Mark one as read ──────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }, [])

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true })
      .eq('user_id', user.id).eq('read', false)
  }, [user])

  // ── Delete one ────────────────────────────────────────────────────────────
  const deleteNotif = useCallback(async (id, e) => {
    e.stopPropagation()
    setNotifs((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }, [])

  // ── Click notification ────────────────────────────────────────────────────
  const handleClick = (notif) => {
    markRead(notif.id)
    setOpen(false)
    if (notif.link) navigate(notif.link)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button type="button" onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:w-96">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unread > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button type="button" onClick={markAllRead}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-lavender dark:hover:bg-gray-800">
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading && (
              <div className="flex flex-col gap-2 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            )}

            {!loading && notifs.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Bell className="h-8 w-8 text-gray-200 dark:text-gray-700" />
                <p className="text-sm font-medium text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 dark:text-gray-600">
                  Complete quizzes or join the community to get started
                </p>
              </div>
            )}

            {!loading && notifs.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={`group relative flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                  !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                }`}
              >
                {/* Icon */}
                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${typeBg(n.type)}`}>
                  {typeIcon(n.type)}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-snug ${
                    !n.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">{n.body}</p>
                  <p className="mt-1 text-[10px] text-gray-400">{timeAgo(n.created_at)}</p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => deleteNotif(n.id, e)}
                  className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-lg text-gray-300 hover:text-red-400 group-hover:flex dark:text-gray-600"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </button>
            ))}
          </div>

          {/* Footer */}
          {notifs.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
              <p className="text-center text-xs text-gray-400">
                {notifs.length} notification{notifs.length !== 1 ? 's' : ''} · Showing last 30
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
