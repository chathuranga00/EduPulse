import { chatWithTutor } from '../server/lib/tutor.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, history } = req.body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const text = await chatWithTutor(message.trim(), history || [])
    res.status(200).json({ text })
  } catch (err) {
    console.error('Tutor API error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate tutor response' })
  }
}
