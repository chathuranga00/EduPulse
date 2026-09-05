import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, Moon, Sun, Menu, Settings, LogOut, BookOpen, Users, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { BASE_QUIZZES } from '../../pages/Quizzes.jsx'
import logo from '../../assets/logo.png'

// ── Search result item ────────────────────────────────────────────────────────
function ResultItem({ icon, label, sub, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-lavender dark:hover:bg-gray-800">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-primary dark:bg-gray-800">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {sub && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
      </div>
    </button>
  )
}

// ── Main Header ───────────────────────────────────────────────────────────────
export default function Header({ onMenuClick }) {
  const { darkMode, toggleDarkMode }    = useTheme()
  const { user, initials, logout }      = useAuth()
  const navigate                        = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState([])
  const [searching, setSearching]       = useState(false)
  const [showResults, setShowResults]   = useState(false)
  const dropRef   = useRef(null)
  const searchRef = useRef(null)
  const timerRef  = useRef(null)

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close search results on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Real-time search with debounce
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    try {
      const term = q.trim().toLowerCase()

      // Search community posts from Supabase (real-time)
      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, course, author_name')
        .or(`content.ilike.%${term}%,course.ilike.%${term}%,author_name.ilike.%${term}%`)
        .limit(4)

      // Search quizzes from static list
      const quizResults = BASE_QUIZZES.filter((q) =>
        q.title?.toLowerCase().includes(term) ||
        q.subject?.toLowerCase().includes(term)
      ).slice(0, 3)

      const combined = [
        ...quizResults.map((q) => ({
          type: 'quiz', id: q.id, label: q.title, sub: `${q.subject} · ${q.difficulty}`,
        })),
        ...(posts || []).map((p) => ({
          type: 'post', id: p.id,
          label: p.content?.substring(0, 60) + (p.content?.length > 60 ? '…' : ''),
          sub: `${p.author_name} · ${p.course}`,
        })),
      ]

      setResults(combined)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setShowResults(true)
    clearTimeout(timerRef.current)
    if (!val.trim()) { setResults([]); return }
    // Debounce 300ms
    timerRef.current = setTimeout(() => doSearch(val), 300)
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const handleResultClick = (result) => {
    clearSearch()
    if (result.type === 'quiz') navigate('/quizzes')
    else if (result.type === 'post') navigate('/community')
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-indigo-100/80 bg-white/90 px-4 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">
      <button type="button" onClick={onMenuClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-lavender lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Search bar ── */}
      <div className="relative min-w-0 flex-1 sm:max-w-md" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => query && setShowResults(true)}
          placeholder="Search quizzes, posts..."
          className="ep-input py-2 pl-10 pr-8 sm:py-2.5"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Results dropdown */}
        {showResults && query && (
          <div className="absolute left-0 right-0 top-12 z-50 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl dark:border-gray-800 dark:bg-gray-900">
            {searching && (
              <p className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">Searching…</p>
            )}
            {!searching && results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No results for <span className="font-medium">"{query}"</span>
              </p>
            )}
            {!searching && results.length > 0 && (
              <>
                {results.filter(r => r.type === 'quiz').length > 0 && (
                  <>
                    <p className="px-3 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Quizzes</p>
                    {results.filter(r => r.type === 'quiz').map(r => (
                      <ResultItem key={r.id} icon={<BookOpen className="h-4 w-4" />}
                        label={r.label} sub={r.sub} onClick={() => handleResultClick(r)} />
                    ))}
                  </>
                )}
                {results.filter(r => r.type === 'post').length > 0 && (
                  <>
                    <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Community</p>
                    {results.filter(r => r.type === 'post').map(r => (
                      <ResultItem key={r.id} icon={<Users className="h-4 w-4" />}
                        label={r.label} sub={r.sub} onClick={() => handleResultClick(r)} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

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
