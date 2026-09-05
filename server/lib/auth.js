import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb } from './db.js'

const SALT_ROUNDS = 12
const JWT_SECRET  = process.env.JWT_SECRET || 'edupulse_dev_secret_change_in_production'
const JWT_EXPIRES = '7d'

// ── Password helpers ──────────────────────────────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

// ── JWT helpers ───────────────────────────────────────────────────────────────
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

// ── Cookie helpers ────────────────────────────────────────────────────────────
export function setAuthCookie(res, token) {
  const maxAge = 7 * 24 * 60 * 60
  res.setHeader('Set-Cookie', `ep_token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`)
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'ep_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
}

export function getTokenFromCookies(req) {
  const raw   = req.headers.cookie || ''
  const match = raw.match(/(?:^|;\s*)ep_token=([^;]+)/)
  return match ? match[1] : null
}

export function requireAuth(req) {
  const token = getTokenFromCookies(req)
  if (!token) throw Object.assign(new Error('Not authenticated.'), { status: 401 })
  try {
    return verifyToken(token)
  } catch {
    throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function dbErr(error) {
  throw new Error(error?.message || 'Database error')
}

function safeUser(user) {
  if (!user) return null
  const { password: _pw, ...rest } = user
  return rest
}

// ── User CRUD ─────────────────────────────────────────────────────────────────
export async function registerUser({ name, email, password }) {
  if (!name?.trim())                    throw new Error('Name is required.')
  if (!email?.trim())                   throw new Error('Email is required.')
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.')

  const db = getDb()

  // check existing
  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle()

  if (existing) throw new Error('An account with this email already exists.')

  const hashed = await hashPassword(password)

  const { data: user, error } = await db
    .from('users')
    .insert({ name: name.trim(), email: email.trim().toLowerCase(), password: hashed })
    .select()
    .single()

  if (error) dbErr(error)

  // create default settings
  const { error: settingsError } = await db
    .from('user_settings')
    .insert({ user_id: user.id })

  if (settingsError) dbErr(settingsError)

  return safeUser(user)
}

export async function loginUser({ email, password }) {
  const db = getDb()

  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('email', email?.trim().toLowerCase() || '')
    .maybeSingle()

  if (error) dbErr(error)
  if (!user) throw new Error('Invalid email or password.')

  const ok = await verifyPassword(password, user.password)
  if (!ok) throw new Error('Invalid email or password.')

  return safeUser(user)
}

export async function getUserById(id) {
  const db = getDb()

  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) dbErr(error)
  return safeUser(user)
}

export async function updateUserProfile(id, { name, university, bio, avatar }) {
  const db      = getDb()
  const updates = {}
  if (name       !== undefined) updates.name       = name
  if (university !== undefined) updates.university = university
  if (bio        !== undefined) updates.bio        = bio
  if (avatar     !== undefined) updates.avatar     = avatar

  const { data: user, error } = await db
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) dbErr(error)
  return safeUser(user)
}

export async function updateUserPassword(id, { currentPassword, newPassword }) {
  const db = getDb()

  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !user) throw new Error('User not found.')

  const ok = await verifyPassword(currentPassword, user.password)
  if (!ok) throw new Error('Current password is incorrect.')

  if (!newPassword || newPassword.length < 6)
    throw new Error('New password must be at least 6 characters.')

  const hashed = await hashPassword(newPassword)

  const { error: updateError } = await db
    .from('users')
    .update({ password: hashed })
    .eq('id', id)

  if (updateError) dbErr(updateError)
}

// ── Settings CRUD ─────────────────────────────────────────────────────────────
export async function getUserSettings(userId) {
  const db = getDb()

  const { data, error } = await db
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) dbErr(error)
  return data
}

export async function updateUserSettings(userId, settings) {
  const db      = getDb()
  const allowed = ['email_notifs', 'study_reminders', 'community_notifs', 'two_fa', 'profile_visible', 'dark_mode']
  const updates = {}

  for (const key of allowed) {
    if (key in settings) updates[key] = Boolean(settings[key])
  }

  if (!Object.keys(updates).length) return getUserSettings(userId)

  const { data, error } = await db
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) dbErr(error)
  return data
}
