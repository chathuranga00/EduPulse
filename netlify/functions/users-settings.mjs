import { requireAuth, getUserSettings, updateUserSettings } from '../../server/lib/auth.js'

export default async (req) => {
  try {
    const { id } = requireAuth(req)
    if (req.method === 'GET') {
      const settings = await getUserSettings(id)
      return new Response(JSON.stringify({ settings }), { status: 200 })
    }
    if (req.method === 'PUT') {
      const body     = await req.json()
      const settings = await updateUserSettings(id, body)
      return new Response(JSON.stringify({ settings }), { status: 200 })
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status || 400 })
  }
}

export const config = { path: '/api/users/settings' }
