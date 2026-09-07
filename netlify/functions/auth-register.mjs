import { registerUser, signToken, setAuthCookie } from '../../server/lib/auth.js'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const { name, email, password } = await req.json()
    const user  = await registerUser({ name, email, password })
    const token = signToken({ id: user.id, email: user.email })
    const headers = new Headers({ 'Content-Type': 'application/json' })
    setAuthCookie({ setHeader: (k, v) => headers.set(k, v) }, token)
    return new Response(JSON.stringify({ user }), { status: 201, headers })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
}

export const config = { path: '/api/auth/register' }
