import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { chatWithTutor } from './server/lib/tutor.js'
import { analyzeDocument } from './server/lib/analyzePdf.js'
import { generateQuiz } from './server/lib/generateQuiz.js'
import {
  registerUser, loginUser, getUserById,
  updateUserProfile, updateUserPassword,
  getUserSettings, updateUserSettings,
  signToken, setAuthCookie, clearAuthCookie, requireAuth,
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
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.end(JSON.stringify(payload))
}

async function handleApi(req, res) {
  const url = req.url?.split('?')[0]

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
    res.end()
    return true
  }

  if (req.method === 'POST' && url === '/api/tutor') {
    const { message, history } = await readJsonBody(req)
    if (!message?.trim()) { sendJson(res, 400, { error: 'Message is required' }); return true }
    const text = await chatWithTutor(message.trim(), history || [])
    sendJson(res, 200, { text }); return true
  }

  if (req.method === 'POST' && url === '/api/analyze-pdf') {
    const { text, fileName } = await readJsonBody(req)
    if (!text?.trim()) { sendJson(res, 400, { error: 'Document text is required' }); return true }
    const result = await analyzeDocument(text, fileName || 'document')
    sendJson(res, 200, result); return true
  }

  if (req.method === 'POST' && url === '/api/generate-quiz') {
    const { subject, topic, questionCount, difficulty } = await readJsonBody(req)
    if (!subject?.trim()) { sendJson(res, 400, { error: 'Subject is required' }); return true }
    const quiz = await generateQuiz({
      subject: subject.trim(), topic: topic?.trim() || '',
      questionCount: Math.min(Math.max(Number(questionCount) || 10, 5), 30),
      difficulty: difficulty || 'Medium',
    })
    sendJson(res, 200, quiz); return true
  }

  if (req.method === 'POST' && url === '/api/auth/register') {
    const { name, email, password } = await readJsonBody(req)
    const user  = await registerUser({ name, email, password })
    const token = signToken({ id: user.id, email: user.email })
    setAuthCookie(res, token)
    sendJson(res, 201, { user }); return true
  }

  if (req.method === 'POST' && url === '/api/auth/login') {
    const { email, password } = await readJsonBody(req)
    const user  = await loginUser({ email, password })
    const token = signToken({ id: user.id, email: user.email })
    setAuthCookie(res, token)
    sendJson(res, 200, { user }); return true
  }

  if (req.method === 'POST' && url === '/api/auth/logout') {
    clearAuthCookie(res)
    sendJson(res, 200, { ok: true }); return true
  }

  if (req.method === 'GET' && url === '/api/auth/me') {
    const { id }   = requireAuth(req)
    const user     = await getUserById(id)
    const settings = await getUserSettings(id)
    if (!user) { sendJson(res, 401, { error: 'User not found.' }); return true }
    sendJson(res, 200, { user, settings }); return true
  }

  if (req.method === 'PUT' && url === '/api/users/profile') {
    const { id }  = requireAuth(req)
    const body    = await readJsonBody(req)
    const updated = await updateUserProfile(id, body)
    sendJson(res, 200, { user: updated }); return true
  }

  if (req.method === 'PUT' && url === '/api/users/password') {
    const { id } = requireAuth(req)
    const body   = await readJsonBody(req)
    await updateUserPassword(id, body)
    sendJson(res, 200, { ok: true }); return true
  }

  if (req.method === 'GET' && url === '/api/users/settings') {
    const { id }   = requireAuth(req)
    const settings = await getUserSettings(id)
    sendJson(res, 200, { settings }); return true
  }

  if (req.method === 'PUT' && url === '/api/users/settings') {
    const { id }   = requireAuth(req)
    const body     = await readJsonBody(req)
    const settings = await updateUserSettings(id, body)
    sendJson(res, 200, { settings }); return true
  }

  return false
}

function apiRoutesPlugin() {
  return {
    name: 'edupulse-api-routes',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        console.log('[API]', req.method, req.url)
        if (!req.url?.startsWith('/api/')) return next()
        try {
          const handled = await handleApi(req, res)
          if (!handled) next()
        } catch (err) {
          const status = err.status || 500
          sendJson(res, status, { error: err.message || 'Server error' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.NVIDIA_API_KEY       = env.NVIDIA_API_KEY
  process.env.NVIDIA_MODEL         = env.NVIDIA_MODEL
  process.env.JWT_SECRET           = env.JWT_SECRET
  process.env.SUPABASE_URL         = env.SUPABASE_URL
  process.env.SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY

  return {
    plugins: [react(), tailwindcss(), apiRoutesPlugin()],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    base: './',
  }
})
