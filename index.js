import express from 'express'
import dotenv from 'dotenv'

import { analyzeDocument } from './server/lib/analyzePdf.js'
import { getAnthropicClient, getModel as getAnthropicModel } from './server/lib/anthropic.js'
import {
  registerUser,
  loginUser,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  getUserById,
} from './server/lib/auth.js'
import { getDb } from './server/lib/db.js'
import { generateQuiz } from './server/lib/generateQuiz.js'
import { getNvidiaClient, getModel as getNvidiaModel } from './server/lib/nvidia.js'
import { chatWithTutor } from './server/lib/tutor.js'

dotenv.config()

const app = express()
app.use(express.json())

// ── Health check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post('/auth/signup', async (req, res) => {
  try {
    const user = await registerUser(req.body || {})
    const token = signToken({ id: user.id, email: user.email })
    setAuthCookie(res, token)
    res.status(201).json({ user })
  } catch (err) {
    res.status(err.status || 400).json({ error: err.message })
  }
})

app.post('/auth/login', async (req, res) => {
  try {
    const user = await loginUser(req.body || {})
    const token = signToken({ id: user.id, email: user.email })
    setAuthCookie(res, token)
    res.status(200).json({ user })
  } catch (err) {
    res.status(err.status || 401).json({ error: err.message })
  }
})

app.post('/auth/logout', (req, res) => {
  clearAuthCookie(res)
  res.status(200).json({ ok: true })
})

// ── Tutor ────────────────────────────────────────────────────────────────────
app.post('/tutor/chat', async (req, res) => {
  try {
    const { message, history } = req.body || {}
    const reply = await chatWithTutor(message, history)
    res.status(200).json({ reply })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

// ── Quiz ─────────────────────────────────────────────────────────────────────
app.post('/quiz/generate', async (req, res) => {
  try {
    const quiz = await generateQuiz(req.body || {})
    res.status(200).json({ quiz })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

// ── PDF ──────────────────────────────────────────────────────────────────────
app.post('/pdf/analyze', async (req, res) => {
  try {
    const { text, fileName } = req.body || {}
    const analysis = await analyzeDocument(text, fileName)
    res.status(200).json({ analysis })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`EduPulse server listening on port ${PORT}`)
})
