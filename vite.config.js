import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { chatWithTutor } from './server/lib/tutor.js'
import { analyzeDocument } from './server/lib/analyzePdf.js'
import { generateQuiz } from './server/lib/generateQuiz.js'
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  getUserSettings,
  updateUserSettings,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} from './server/lib/auth.js'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) }
      catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function apiRoutesPlugin() {
  return {
    name: 'edupulse-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0]

        // ── AI Tutor ──────────────────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/tutor') {
          try {
            const body = await readJsonBody(req)
            const { message, history } = body
            if (!message || typeof message !== 'string' || !message.trim()) {
              return sendJson(res, 400, { error: 'Message is required' })
            }
            const text = await chatWithTutor(message.trim(), history || [])
            return sendJson(res, 200, { text })
          } catch (err) {
            console.error('Tutor API error:', err)
            return sendJson(res, 500, { error: err.message || 'Failed to generate tutor response' })
          }
        }

        // ── PDF Analysis ──────────────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/analyze-pdf') {
          try {
            const body = await readJsonBody(req)
            const { text, fileName } = body
            if (!text || typeof text !== 'string' || !text.trim()) {
              return sendJson(res, 400, { error: 'Document text is required' })
            }
            const result = await analyzeDocument(text, fileName || 'document')
            return sendJson(res, 200, result)
          } catch (err) {
            console.error('Analyze PDF API error:', err)
            return sendJson(res, 500, { error: err.message || 'Failed to analyze document' })
          }
        }

        // ── Generate Quiz ─────────────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/generate-quiz') {
          try {
            const body = await readJsonBody(req)
            const { subject, topic, questionCount, difficulty } = body
            if (!subject || typeof subject !== 'string' || !subject.trim()) {
              return sendJson(res, 400, { error: 'Subject is required' })
            }
            const quiz = await generateQuiz({
              subject:       subject.trim(),
              topic:         topic?.trim() || '',
              questionCount: Math.min(Math.max(Number(questionCount) || 10, 5), 30),
              difficulty:    difficulty || 'Medium',
            })
            return sendJson(res, 200, quiz)
          } catch (err) {
            console.error('Generate quiz API error:', err)
            return sendJson(res, 500, { error: err.message || 'Failed to generate quiz' })
          }
        }

        // ── AUTH: Register ────────────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/auth/register') {
          try {
            const { name, email, password } = await readJsonBody(req)
            const user  = await registerUser({ name, email, password })
            const token = signToken({ id: user.id, email: user.email })
            setAuthCookie(res, token)
            return sendJson(res, 201, { user })
          } catch (err) {
            return sendJson(res, 400, { error: err.message })
          }
        }

        // ── AUTH: Login ───────────────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/auth/login') {
          try {
            const { email, password } = await readJsonBody(req)
            const user  = await loginUser({ email, password })
            const token = signToken({ id: user.id, email: user.email })
            setAuthCookie(res, token)
            return sendJson(res, 200, { user })
          } catch (err) {
            return sendJson(res, 401, { error: err.message })
          }
        }

        // ── AUTH: Logout ──────────────────────────────────────────────────────
        if (req.method === 'POST' && url === '/api/auth/logout') {
          clearAuthCookie(res)
          return sendJson(res, 200, { ok: true })
        }

        // ── AUTH: Me ──────────────────────────────────────────────────────────
        if (req.method === 'GET' && url === '/api/auth/me') {
          try {
            const { id }   = requireAuth(req)
            const user     = await getUserById(id)
            const settings = await getUserSettings(id)
            if (!user) return sendJson(res, 401, { error: 'User not found.' })
            return sendJson(res, 200, { user, settings })
          } catch (err) {
            return sendJson(res, err.status || 401, { error: err.message })
          }
        }

        // ── USERS: Update Profile ─────────────────────────────────────────────
        if (req.method === 'PUT' && url === '/api/users/profile') {
          try {
            const { id }  = requireAuth(req)
            const body    = await readJsonBody(req)
            const updated = await updateUserProfile(id, body)
            return sendJson(res, 200, { user: updated })
          } catch (err) {
            return sendJson(res, err.status || 400, { error: err.message })
          }
        }

        // ── USERS: Change Password ────────────────────────────────────────────
        if (req.method === 'PUT' && url === '/api/users/password') {
          try {
            const { id } = requireAuth(req)
            const body   = await readJsonBody(req)
            await updateUserPassword(id, body)
            return sendJson(res, 200, { ok: true })
          } catch (err) {
            return sendJson(res, err.status || 400, { error: err.message })
          }
        }

        // ── USERS: Get/Update Settings ────────────────────────────────────────
        if (req.method === 'GET' && url === '/api/users/settings') {
          try {
            const { id }   = requireAuth(req)
            const settings = await getUserSettings(id)
            return sendJson(res, 200, { settings })
          } catch (err) {
            return sendJson(res, err.status || 401, { error: err.message })
          }
        }

        if (req.method === 'PUT' && url === '/api/users/settings') {
          try {
            const { id }   = requireAuth(req)
            const body     = await readJsonBody(req)
            const settings = await updateUserSettings(id, body)
            return sendJson(res, 200, { settings })
          } catch (err) {
            return sendJson(res, err.status || 400, { error: err.message })
          }
        }

        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.NVIDIA_API_KEY      = env.NVIDIA_API_KEY
  process.env.NVIDIA_MODEL        = env.NVIDIA_MODEL
  process.env.JWT_SECRET          = env.JWT_SECRET
  process.env.SUPABASE_URL        = env.SUPABASE_URL
  process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

  return {
    plugins: [react(), tailwindcss(), apiRoutesPlugin()],
  }
})
