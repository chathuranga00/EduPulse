import { useState } from 'react'
import { User, Bell, Shield, Palette, Moon, Lock, Loader2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function Toggle({ enabled, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={enabled} aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function Settings() {
  const toast = useToast()
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, settings, updateProfile, changePassword, updateSettings } = useAuth()

  // Profile form state — pre-fill from real user
  const [name, setName]             = useState(user?.name || '')
  const [email]                     = useState(user?.email || '')   // email is display-only
  const [university, setUniversity] = useState(user?.university || '')
  const [bio, setBio]               = useState(user?.bio || '')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving, setPwSaving]   = useState(false)

  // Notification/privacy toggles from real settings
  const [toggles, setToggles] = useState({
    email_notifs:     Boolean(settings?.email_notifs ?? 1),
    study_reminders:  Boolean(settings?.study_reminders ?? 1),
    community_notifs: Boolean(settings?.community_notifs ?? 0),
    two_fa:           Boolean(settings?.two_fa ?? 0),
    profile_visible:  Boolean(settings?.profile_visible ?? 1),
  })
  const [toggleSaving, setToggleSaving] = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      await updateProfile({ name, university, bio })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e) => {
    e.preventDefault()
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return }
    if (newPw.length < 6)   { toast.error('Password must be at least 6 characters'); return }
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
    const next = { ...toggles, [key]: value }
    setToggles(next)
    setToggleSaving(true)
    try {
      await updateSettings(next)
    } catch (err) {
      toast.error(err.message)
      setToggles(toggles) // revert
    } finally {
      setToggleSaving(false)
    }
  }

  return (
    <div className="ep-page mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account preferences and app settings." />

      <div className="space-y-6">

        {/* ── Profile ──────────────────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="ep-input" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" value={email} disabled className="ep-input opacity-60 cursor-not-allowed" />
                <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">University / School</label>
              <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="e.g. University of Colombo" className="ep-input" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us a bit about yourself…" className="ep-input resize-none" />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={handleProfileSave} disabled={profileSaving} className="ep-btn-primary px-6 disabled:opacity-60">
              {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* ── Change Password ───────────────────────────────────────────── */}
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
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" className="ep-input" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" className="ep-input" required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" className="ep-input" required />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pwSaving} className="ep-btn-primary px-6 disabled:opacity-60">
                {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Notifications ─────────────────────────────────────────────── */}
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
              { key: 'email_notifs',     label: 'Email notifications' },
              { key: 'study_reminders',  label: 'Study reminders' },
              { key: 'community_notifs', label: 'Community updates' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <Toggle enabled={toggles[key]} onChange={(v) => handleToggle(key, v)} label={label} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Privacy & Security ───────────────────────────────────────── */}
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
              { key: 'two_fa',          label: 'Two-factor authentication' },
              { key: 'profile_visible', label: 'Profile visibility' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <Toggle enabled={toggles[key]} onChange={(v) => handleToggle(key, v)} label={label} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Appearance ───────────────────────────────────────────────── */}
        <div className="ep-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender dark:bg-gray-800">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          <div className="flex items-center justify-between gap-4">
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

      </div>
    </div>
  )
}
