import { requireAuth, getUserById, getUserSettings } from '../../server/lib/auth.js'

export default async (req) => {
  try {
    const { id } = requireAuth(req)
    const user     = await getUserById(id)
    const settings = await getUserSettings(id)
    if (!user) return new Response(JSON.stringify({ error: 'User not found.' }), { status: 401 })
    return new Response(JSON.stringify({ user, settings }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status || 401 })
  }
}

export const config = { path: '/api/auth/me' }
