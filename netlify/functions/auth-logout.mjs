import { clearAuthCookie } from '../../server/lib/auth.js'

export default async (req) => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  clearAuthCookie({ setHeader: (k, v) => headers.set(k, v) })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers })
}

export const config = { path: '/api/auth/logout' }
