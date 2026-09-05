import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Layout from './components/layout/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AITutor from './pages/AITutor.jsx'
import PDFAnalysis from './pages/PDFAnalysis.jsx'
import StudyPlanner from './pages/StudyPlanner.jsx'
import Quizzes from './pages/Quizzes.jsx'
import Community from './pages/Community.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import LoadingSpinner from './components/ui/LoadingSpinner.jsx'

// Redirect to login if not authenticated
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location          = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lavender-light dark:bg-gray-950">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

// Redirect to home if already logged in
function GuestOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-lavender-light dark:bg-gray-950">
        <LoadingSpinner />
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Guest-only auth pages */}
            <Route path="/login"  element={<GuestOnly><Login /></GuestOnly>} />
            <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />

            {/* Protected app pages */}
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<Dashboard />} />
              <Route path="ai-tutor"      element={<AITutor />} />
              <Route path="pdf-analysis"  element={<PDFAnalysis />} />
              <Route path="study-planner" element={<StudyPlanner />} />
              <Route path="quizzes"       element={<Quizzes />} />
              <Route path="community"     element={<Community />} />
              <Route path="settings"      element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
