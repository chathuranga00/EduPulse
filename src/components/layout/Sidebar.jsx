import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, FileText, CalendarDays,
  ClipboardList, Users, Settings, HelpCircle,
  X, LogOut,
} from 'lucide-react'
import logo from '../../assets/logo.png'
import { useAuth } from '../../context/AuthContext.jsx'

const navItems = [
  { to: '/',              label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/ai-tutor',      label: 'AI Tutor',      icon: MessageSquare },
  { to: '/pdf-analysis',  label: 'PDF Analysis',  icon: FileText },
  { to: '/study-planner', label: 'Study Planner', icon: CalendarDays },
  { to: '/quizzes',       label: 'Quizzes',       icon: ClipboardList },
  { to: '/community',     label: 'Community',     icon: Users },
  { to: '/settings',      label: 'Settings',      icon: Settings },
]

export default function Sidebar({ open, onClose }) {
  const { user, initials, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-indigo-100/80 bg-white transition-transform duration-300 ease-out dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        {/* Logo */}
        <div className="mb-8 flex items-start justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-indigo-200/50 transition-transform duration-200 hover:scale-105 dark:shadow-none">
              <img src={logo} alt="EduPulse AI" className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">EduPulse AI</h1>
              <p className="text-xs font-medium text-primary">{user?.plan === 'plus' ? 'Plus Plan' : 'Student Plan'}</p>
            </div>
          </div>
          <button
            type="button" onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-lavender hover:text-gray-600 lg:hidden dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-gray-600 hover:bg-lavender hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            className="w-full rounded-2xl bg-gradient-to-r from-primary to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/50 transition-all duration-200 hover:from-primary-hover hover:to-violet-600 hover:shadow-lg active:scale-[0.98] dark:shadow-none"
          >
            Upgrade to Plus
          </button>

          <a href="#help" className="ep-btn-ghost px-3">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </a>

          <button type="button" onClick={handleLogout} className="ep-btn-ghost w-full px-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* User info at bottom */}
      <div className="border-t border-indigo-100/80 p-4 dark:border-gray-800">
        <NavLink to="/settings" onClick={onClose}
          className="flex items-center gap-3 rounded-2xl bg-lavender p-3 transition-colors duration-200 hover:bg-indigo-100/70 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-400 text-sm font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
