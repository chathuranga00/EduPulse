import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

// Domain modules — wired in below as routes are implemented.
import { requireAuth, registerUser, loginUser, signToken, setAuthCookie, clearAuthCookie } from './lib/auth.js'
import { chatWithTutor } from './lib/tutor.js'
import { generateQuiz } from './lib/generateQuiz.js'
import { analyzeDocument } from './lib/analyzePdf.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// ── Health check ────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'edupulse-backend' })
})

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  try {
    const user = await registerUser(req.body || {})
    const token = signToken({ id: user.id, email: user.email })
    setAuthCookie(res, token)
    res.status(201).json({ user })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const user = await loginUser(req.body || {})
    const token = signToken({ id: user.id, email: user.email })
    setAuthCookie(res, token)
    res.json({ user })
  } catch (error) {
    res.status(error.status || 400).json({ error: error.message })
  }
})

app.post('/auth/logout', (_req, res) => {
  clearAuthCookie(res)
  res.json({ ok: true })
})

// ── Tutor route ──────────────────────────────────────────────────────────────
app.post('/tutor', async (req, res) => {
  try {
    requireAuth(req)
    const { message, history } = req.body || {}
    const reply = await chatWithTutor(message, history)
    res.json({ reply })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

// ── Quiz route ───────────────────────────────────────────────────────────────
app.post('/quiz', async (req, res) => {
  try {
    requireAuth(req)
    const quiz = await generateQuiz(req.body || {})
    res.json({ quiz })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

// ── PDF analysis route ───────────────────────────────────────────────────────
app.post('/analyze-pdf', async (req, res) => {
  try {
    requireAuth(req)
    const { text, fileName } = req.body || {}
    const analysis = await analyzeDocument(text, fileName)
    res.json({ analysis })
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`EduPulse backend listening on port ${PORT}`)
})

export default app
