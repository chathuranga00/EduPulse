import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, Moon, Sun, Menu, Settings, LogOut,
  BookOpen, Users, X, LayoutDashboard, MessageSquare,
  FileText, CalendarDays, ClipboardList, ChevronRight,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { supabase } from '../../lib/supabase.js'
import { BASE_QUIZZES } from '../../pages/Quizzes.jsx'
import NotificationBell from './NotificationBell.jsx'
import logo from '../../assets/logo.png'

// ── All app pages — shown as shortcuts when search is empty ───────────────────
const PAGES = [
  { to: '/',              label: 'Dashboard',     sub: 'Overview & stats',             icon: LayoutDashboard },
  { to: '/ai-tutor',      label: 'AI Tutor',      sub: 'Chat with your AI assistant',  icon: MessageSquare },
  { to: '/pdf-analysis',  label: 'PDF Analysis',  sub: 'Analyse documents with AI',    icon: FileText },
  { to: '/study-planner', label: 'Study Planner', sub: 'Tasks, calendar & events',     icon: CalendarDays },
  { to: '/quizzes',       label: 'Quizzes',       sub: 'Practice & test yourself',     icon: ClipboardList },
  { to: '/community',     label: 'Community',     sub: 'Posts, discussions & topics',  icon: Users },
  { to: '/settings',      label: 'Settings',      sub: 'Account & preferences',        icon: Settings },
]

// ── Single result row ─────────────────────────────────────────────────────────
function Row({ icon: Icon, label, sub, onClick, accent = false }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-lavender dark:hover:bg-gray-800">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        accent ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
      }`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {sub && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
    </button>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{children}</p>
}

// ── Main Header ───────────────────────────────────────────────────────────────
export default function Header({ onMenuClick }) {
  const { darkMode, toggleDarkMode } = useTheme()
  const { user, initials, logout }   = useAuth()
  const navigate                     = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState({ pages: [], quizzes: [], posts: [] })
  const [searching, setSearching]       = useState(false)
  const [open, setOpen]                 = useState(false)

  const dropRef   = useRef(null)
  const searchRef = useRef(null)
  const timerRef  = useRef(null)

  // Close user dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Close search panel on outside click
  useEffect(() => {
    const h = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // ── Real-time search ──────────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults({ pages: [], quizzes: [], posts: [] }); setSearching(false); return }
    setSearching(true)
    const term = q.trim().toLowerCase()

    // Pages — instant, local
    const pages = PAGES.filter((p) =>
      p.label.toLowerCase().includes(term) || p.sub.toLowerCase().includes(term)
    )

    // Quizzes — instant, local (126 items)
    const quizzes = BASE_QUIZZES.filter((q) =>
      q.title?.toLowerCase().includes(term) ||
      q.subject?.toLowerCase().includes(term)
    ).slice(0, 4)

    // Community posts — live from Supabase
    const { data: posts } = await supabase
      .from('posts')
      .select('id, content, course, author_name')
      .or(`content.ilike.%${term}%,course.ilike.%${term}%,author_name.ilike.%${term}%`)
      .limit(4)

    setResults({ pages, quizzes, posts: posts || [] })
    setSearching(false)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    clearTimeout(timerRef.current)
    if (!val.trim()) { setResults({ pages: [], quizzes: [], posts: [] }); return }
    timerRef.current = setTimeout(() => doSearch(val), 280)
  }

  const clear = () => { setQuery(''); setResults({ pages: [], quizzes: [], posts: [] }); setOpen(false) }

  const go = (path) => { clear(); navigate(path) }

  const handleLogout = async () => { setDropdownOpen(false); await logout(); navigate('/login', { replace: true }) }

  // What to show in the dropdown
  const isEmpty = !query.trim()
  const hasResults = results.pages.length || results.quizzes.length || results.posts.length
  const totalResults = results.pages.length + results.quizzes.length + results.posts.length

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-indigo-100/80 bg-white/90 px-4 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6 dark:border-gray-800 dark:bg-gray-900/90">

      {/* Hamburger */}
      <button type="button" onClick={onMenuClick}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 transition hover:bg-lavender lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      {/* ── Search ── */}
      <div className="relative min-w-0 flex-1 sm:max-w-md" ref={searchRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          placeholder="Search or jump to…"
          autoComplete="off"
          className="ep-input py-2 pl-10 pr-8 sm:py-2.5"
        />
        {query && (
          <button type="button" onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}

        {/* ── Dropdown ── */}
        {open && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">

            {/* Empty state — show page shortcuts */}
            {isEmpty && (
              <div className="p-2">
                <SectionLabel>Jump to</SectionLabel>
                {PAGES.map((p) => (
                  <Row key={p.to} icon={p.icon} label={p.label} sub={p.sub}
                    accent onClick={() => go(p.to)} />
                ))}
              </div>
            )}

            {/* Searching spinner */}
            {!isEmpty && searching && (
              <p className="px-4 py-5 text-center text-sm text-gray-400">Searching…</p>
            )}

            {/* No results */}
            {!isEmpty && !searching && !hasResults && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  No results for <span className="text-primary">"{query}"</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">Try a page name, quiz subject, or community topic</p>
              </div>
            )}

            {/* Results */}
            {!isEmpty && !searching && hasResults && (
              <div className="max-h-96 overflow-y-auto p-2">

                {results.pages.length > 0 && (
                  <>
                    <SectionLabel>Pages</SectionLabel>
                    {results.pages.map((p) => (
                      <Row key={p.to} icon={p.icon} label={p.label} sub={p.sub}
                        accent onClick={() => go(p.to)} />
                    ))}
                  </>
                )}

                {results.quizzes.length > 0 && (
                  <>
                    <SectionLabel>Quizzes</SectionLabel>
                    {results.quizzes.map((q) => (
                      <Row key={q.id} icon={BookOpen}
                        label={q.title} sub={`${q.subject} · ${q.difficulty}`}
                        onClick={() => go('/quizzes')} />
                    ))}
                  </>
                )}

                {results.posts.length > 0 && (
                  <>
                    <SectionLabel>Community</SectionLabel>
                    {results.posts.map((p) => (
                      <Row key={p.id} icon={Users}
                        label={p.content?.substring(0, 55) + (p.content?.length > 55 ? '…' : '')}
                        sub={`${p.author_name} · ${p.course}`}
                        onClick={() => go('/community')} />
                    ))}
                  </>
                )}

                <div className="mt-1 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
                  <p className="text-center text-xs text-gray-400">{totalResults} result{totalResults !== 1 ? 's' : ''}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link to="/ai-tutor" className="ep-btn-primary hidden gap-2 px-3 py-2 sm:inline-flex">
          <img src={logo} alt="" className="h-4 w-4 rounded object-cover" />
          <span className="hidden md:inline">Ask AI</span>
        </Link>
        <Link to="/ai-tutor" className="ep-btn-primary inline-flex h-10 w-10 overflow-hidden p-0 sm:hidden" aria-label="Ask AI">
          <img src={logo} alt="Ask AI" className="h-full w-full object-cover" />
        </Link>

        <NotificationBell />

        <button type="button" onClick={toggleDarkMode}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-lavender dark:text-gray-300 dark:hover:bg-gray-800">
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* User dropdown */}
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
