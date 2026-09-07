import { requireAuth, updateUserProfile } from '../../server/lib/auth.js'

export default async (req) => {
  if (req.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const { id }  = requireAuth(req)
    const body    = await req.json()
    const updated = await updateUserProfile(id, body)
    return new Response(JSON.stringify({ user: updated }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: err.status || 400 })
  }
}

export const config = { path: '/api/users/profile' }
