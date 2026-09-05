import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import logo from '../assets/logo.png'

export default function Login() {
  const { login }         = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate          = useNavigate()
  const location          = useLocation()
  const from              = location.state?.from?.pathname || '/'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-lavender-light p-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-indigo-200/50 dark:shadow-none">
            <img src={logo} alt="EduPulse AI" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">EduPulse AI</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div className="ep-card p-8">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="ep-input"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ep-input pr-10"
                />
                <button
                  type="button" onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="ep-btn-primary w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:text-primary-hover">
            Create one
          </Link>
        </p>

        {/* Dark mode toggle */}
        <div className="mt-4 flex justify-center">
          <button
            type="button" onClick={toggleDarkMode}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {darkMode ? '☀ Light mode' : '🌙 Dark mode'}
          </button>
        </div>
      </div>
    </div>
  )
}
