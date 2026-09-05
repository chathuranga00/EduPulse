import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Moon, Sun, Sparkles, Menu, Settings, LogOut } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import logo from '../../assets/logo.png'

export default function Header({ onMenuClick }) {
  const { darkMode, toggleDarkMode }    = useTheme()
  const { user, initials, logout }      = useAuth()
  const navigate                        = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-indigo-100/80 bg-white/90 px-4 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      <button type="button" onClick={onMenuClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-lavender lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 sm:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="search" placeholder="Search courses, notes..." className="ep-input py-2 pl-10 pr-4 sm:py-2.5" />
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        <a href="#library" className="ep-btn-ghost px-0 py-0 hover:bg-transparent">My Library</a>
        <a href="#classes" className="ep-btn-ghost px-0 py-0 hover:bg-transparent">Live Classes</a>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Ask AI button — desktop */}
        <Link to="/ai-tutor" className="ep-btn-primary hidden gap-2 px-3 py-2 sm:inline-flex">
          <img src={logo} alt="" className="h-4 w-4 rounded object-cover" />
          <span className="hidden md:inline">Ask AI</span>
        </Link>
        {/* Ask AI button — mobile */}
        <Link to="/ai-tutor" className="ep-btn-primary inline-flex h-10 w-10 overflow-hidden p-0 sm:hidden" aria-label="Ask AI">
          <img src={logo} alt="Ask AI" className="h-full w-full object-cover" />
        </Link>

        <button type="button" aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        <button type="button" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={dropRef}>
          <button type="button" onClick={() => setDropdownOpen((v) => !v)} aria-label="User menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-400 text-sm font-semibold text-white shadow-sm transition hover:scale-105">
            {initials}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <img src={logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
              <div className="p-1.5">
                <Link to="/settings" onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <button type="button" onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
