import { createServer } from 'http'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

import { chatWithTutor }   from './lib/tutor.js'
import { analyzeDocument } from './lib/analyzePdf.js'
import { generateQuiz }    from './lib/generateQuiz.js'
import {
  registerUser, loginUser, getUserById,
  updateUserProfile, updateUserPassword,
  getUserSettings, updateUserSettings,
  signToken, setAuthCookie, clearAuthCookie, requireAuth,
} from './lib/auth.js'

const PORT = process.env.API_PORT || 3001

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', c => data += c)
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch { reject(new Error('Invalid JSON')) } })
    req.on('error', reject)
  })
}

function json(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    'Access-Control-Allow-Credentials': 'true',
  })
  res.end(JSON.stringify(payload))
}

const server = createServer(async (req, res) => {
  const url = req.url?.split('?')[0]

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,Cookie',
    })
    res.end(); return
  }

  try {
    // ── AI Tutor ─────────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/api/tutor') {
      const { message, history } = await readBody(req)
      if (!message?.trim()) return json(res, 400, { error: 'Message is required' })
      const text = await chatWithTutor(message.trim(), history || [])
      return json(res, 200, { text })
    }

    // ── PDF Analysis ──────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/api/analyze-pdf') {
      const { text, fileName } = await readBody(req)
      if (!text?.trim()) return json(res, 400, { error: 'Text is required' })
      const result = await analyzeDocument(text, fileName || 'document')
      return json(res, 200, result)
    }

    // ── Generate Quiz ─────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/api/generate-quiz') {
      const { subject, topic, questionCount, difficulty } = await readBody(req)
      if (!subject?.trim()) return json(res, 400, { error: 'Subject is required' })
      const quiz = await generateQuiz({
        subject: subject.trim(), topic: topic?.trim() || '',
        questionCount: Math.min(Math.max(Number(questionCount) || 10, 5), 30),
        difficulty: difficulty || 'Medium',
      })
      return json(res, 200, quiz)
    }

    // ── Auth: Register ────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/api/auth/register') {
      const { name, email, password } = await readBody(req)
      const user  = await registerUser({ name, email, password })
      const token = signToken({ id: user.id, email: user.email })
      setAuthCookie(res, token)
      return json(res, 201, { user })
    }

    // ── Auth: Login ───────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/api/auth/login') {
      const { email, password } = await readBody(req)
      const user  = await loginUser({ email, password })
      const token = signToken({ id: user.id, email: user.email })
      setAuthCookie(res, token)
      return json(res, 200, { user })
    }

    // ── Auth: Logout ──────────────────────────────────────────────────────────
    if (req.method === 'POST' && url === '/api/auth/logout') {
      clearAuthCookie(res)
      return json(res, 200, { ok: true })
    }

    // ── Auth: Me ──────────────────────────────────────────────────────────────
    if (req.method === 'GET' && url === '/api/auth/me') {
      const { id }   = requireAuth(req)
      const user     = await getUserById(id)
      const settings = await getUserSettings(id)
      if (!user) return json(res, 401, { error: 'User not found.' })
      return json(res, 200, { user, settings })
    }

    // ── Users: Profile ────────────────────────────────────────────────────────
    if (req.method === 'PUT' && url === '/api/users/profile') {
      const { id }  = requireAuth(req)
      const body    = await readBody(req)
      const updated = await updateUserProfile(id, body)
      return json(res, 200, { user: updated })
    }

    // ── Users: Password ───────────────────────────────────────────────────────
    if (req.method === 'PUT' && url === '/api/users/password') {
      const { id } = requireAuth(req)
      const body   = await readBody(req)
      await updateUserPassword(id, body)
      return json(res, 200, { ok: true })
    }

    // ── Users: Settings ───────────────────────────────────────────────────────
    if (req.method === 'GET' && url === '/api/users/settings') {
      const { id }   = requireAuth(req)
      const settings = await getUserSettings(id)
      return json(res, 200, { settings })
    }

    if (req.method === 'PUT' && url === '/api/users/settings') {
      const { id }   = requireAuth(req)
      const body     = await readBody(req)
      const settings = await updateUserSettings(id, body)
      return json(res, 200, { settings })
    }

    json(res, 404, { error: 'Not found' })

  } catch (err) {
    console.error('[API Error]', err.message)
    json(res, err.status || 500, { error: err.message || 'Server error' })
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ EduPulse AI backend running on http://localhost:${PORT}`)
  console.log(`   Android emulator: http://10.0.2.2:${PORT}`)
  console.log(`   Real device:      http://192.168.8.189:${PORT}\n`)
})
