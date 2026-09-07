import { chatWithTutor } from '../../server/lib/tutor.js'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const { message, history, lang } = await req.json()
    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 })
    }
    const text = await chatWithTutor(message.trim(), history || [], lang || 'en')
    return new Response(JSON.stringify({ text }), { status: 200 })
  } catch (err) {
    console.error('Tutor error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate tutor response' }), { status: 500 })
  }
}

export const config = { path: '/api/tutor' }
