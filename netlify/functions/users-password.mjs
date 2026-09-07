import { requireAuth, updateUserPassword } from '../../server/lib/auth.js'

export default async (req) => {
  if (req.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const { id } = requireAuth(req)
    const body   = await req.json()
    await updateUserPassword(id, body)
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status || 400 })
  }
}

export const config = { path: '/api/users/password' }
