import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import logo from '../assets/logo.png'

export default function Signup() {
  const { register }      = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const navigate          = useNavigate()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/', { replace: true })
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Create your account</p>
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
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                id="name" type="text" autoComplete="name" required
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="ep-input"
              />
            </div>

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
                Password <span className="text-gray-400 font-normal">(min. 6 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password" required
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

            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirm" type={showPw ? 'text' : 'password'} autoComplete="new-password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="ep-input"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="ep-btn-primary w-full py-3 text-base disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>

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
