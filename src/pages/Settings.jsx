import { useState, useEffect } from 'react'
import {
  User, Bell, Shield, Palette, Moon, Lock,
  Loader2, ClipboardCheck, MessageSquare, ListTodo,
  FileText, Wifi, LogOut,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, label, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50
        ${enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200
        ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-lavender-light p-4 dark:bg-gray-800/50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Settings() {
  const toast                        = useToast()
  const navigate                     = useNavigate()
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, settings, initials, updateProfile, changePassword, updateSettings, logout } = useAuth()

  // Profile form — sync when user changes (real-time update from another tab)
  const [name, setName]             = useState(user?.name || '')
  const [university, setUniversity] = useState(user?.university || '')
  const [bio, setBio]               = useState(user?.bio || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileDirty, setProfileDirty]   = useState(false)

  // Keep form in sync with real-time user updates
  useEffect(() => {
    setName(user?.name || '')
    setUniversity(user?.university || '')
    setBio(user?.bio || '')
    setProfileDirty(false)
  }, [user])

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving]   = useState(false)

  // Toggles — sync when settings change (real-time)
  const [toggles, setToggles]         = useState({
    email_notifs:     Boolean(settings?.email_notifs   ?? true),
    study_reminders:  Boolean(settings?.study_reminders ?? true),
    community_notifs: Boolean(settings?.community_notifs ?? false),
    two_fa:           Boolean(settings?.two_fa           ?? false),
    profile_visible:  Boolean(settings?.profile_visible  ?? true),
  })
  const [toggleSaving, setToggleSaving] = useState(false)

  useEffect(() => {
    if (!settings) return
    setToggles({
      email_notifs:     Boolean(settings.email_notifs),
      study_reminders:  Boolean(settings.study_reminders),
      community_notifs: Boolean(settings.community_notifs),
      two_fa:           Boolean(settings.two_fa),
      profile_visible:  Boolean(settings.profile_visible),
    })
  }, [settings])

  // Account stats
  const [stats, setStats] = useState({ quizzes: null, tasks: null, chats: null, pdfs: null })

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      supabase.from('quiz_results').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('study_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('done', true),
      supabase.from('tutor_chats').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('pdf_analyses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([q, t, c, p]) => {
      setStats({
        quizzes: q.count ?? 0,
        tasks:   t.count ?? 0,
        chats:   c.count ?? 0,
        pdfs:    p.count ?? 0,
      })
    })
  }, [user?.id])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      await updateProfile({ name, university, bio })
      toast.success('Profile updated')
      setProfileDirty(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (newPw !== confirmPw)  { toast.error('Passwords do not match'); return }
    if (newPw.length < 6)     { toast.error('Password must be at least 6 characters'); return }
    setPwSaving(true)
    try {
      await changePassword(currentPw, newPw)
      toast.success('Password changed successfully')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  const handleToggle = async (key, value) => {
    const prev  = { ...toggles }
    const next  = { ...toggles, [key]: value }
    setToggles(next)
    setToggleSaving(true)
    try {
      await updateSettings(next)
    } catch (err) {
      toast.error(err.message)
      setToggles(prev)
    } finally {
      setToggleSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="ep-page mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences and app settings."
        action={
          <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live sync
          </div>
        }
      />

      <div className="space-y-6">

        {/* ── Avatar + Account Stats ────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-400 text-xl font-bold text-white shadow-md shadow-indigo-200/50 dark:shadow-none">
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{user?.name || '—'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <p className="mt-0.5 text-xs font-medium text-primary">{user?.plan === 'plus' ? '⭐ Plus Plan' : 'Free Plan'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={ClipboardCheck} label="Quizzes"      value={stats.quizzes} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400" />
            <StatCard icon={ListTodo}       label="Tasks Done"   value={stats.tasks}   color="bg-indigo-100 text-primary dark:bg-indigo-900/40" />
            <StatCard icon={MessageSquare}  label="AI Sessions"  value={stats.chats}   color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400" />
            <StatCard icon={FileText}       label="PDFs Analysed" value={stats.pdfs}   color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400" />
          </div>
        </div>

        {/* ── Profile ──────────────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            {profileDirty && <span className="ml-auto text-xs font-medium text-amber-500">Unsaved changes</span>}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input type="text" value={name}
                  onChange={(e) => { setName(e.target.value); setProfileDirty(true) }}
                  className="ep-input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className="ep-input cursor-not-allowed opacity-60" />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">University / School</label>
              <input type="text" value={university}
                onChange={(e) => { setUniversity(e.target.value); setProfileDirty(true) }}
                placeholder="e.g. University of Colombo" className="ep-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea value={bio} rows={3}
                onChange={(e) => { setBio(e.target.value); setProfileDirty(true) }}
                placeholder="Tell us a bit about yourself…" className="ep-input resize-none" />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={handleProfileSave} disabled={profileSaving || !profileDirty}
              className="ep-btn-primary px-6 disabled:opacity-60">
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••" className="ep-input" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  placeholder="••••••••" className="ep-input" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••" className="ep-input" required />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwSaving} className="ep-btn-primary px-6 disabled:opacity-60">
                {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            {toggleSaving && <Loader2 className="ml-auto h-4 w-4 animate-spin text-gray-400" />}
          </div>
          <div className="space-y-4">
            {[
              { key: 'email_notifs',    label: 'Email notifications',  desc: 'Receive updates and reminders via email' },
              { key: 'study_reminders', label: 'Study reminders',       desc: 'Daily reminders to keep your streak going' },
              { key: 'community_notifs',label: 'Community updates',     desc: 'Notifications for replies and new posts' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-xl p-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <Toggle enabled={toggles[key]} onChange={(v) => handleToggle(key, v)}
                  label={label} disabled={toggleSaving} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Privacy & Security ────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy &amp; Security</h2>
            {toggleSaving && <Loader2 className="ml-auto h-4 w-4 animate-spin text-gray-400" />}
          </div>
          <div className="space-y-4">
            {[
              { key: 'two_fa',          label: 'Two-factor authentication', desc: 'Add an extra layer of security to your account' },
              { key: 'profile_visible', label: 'Profile visibility',         desc: 'Allow other students to see your profile' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-xl p-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <Toggle enabled={toggles[key]} onChange={(v) => handleToggle(key, v)}
                  label={label} disabled={toggleSaving} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Appearance ───────────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl p-2">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark themes</p>
              </div>
            </div>
            <Toggle enabled={darkMode} onChange={toggleDarkMode} label="Dark mode" />
          </div>
        </div>

        {/* ── Danger zone ──────────────────────────────────────────── */}
        <div className="ep-card overflow-hidden p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account</h2>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Sign out of EduPulse AI</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">You'll need to sign in again to access your account</p>
            </div>
            <button type="button" onClick={handleLogout}
              className="shrink-0 rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:bg-transparent dark:hover:bg-red-900/20">
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
