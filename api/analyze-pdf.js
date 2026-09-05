import { analyzeDocument } from '../server/lib/analyzePdf.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { text, fileName } = req.body

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Document text is required' })
    }

    const result = await analyzeDocument(text, fileName || 'document')
    res.status(200).json(result)
  } catch (err) {
    console.error('Analyze PDF API error:', err)
    res.status(500).json({ error: err.message || 'Failed to analyze document' })
  }
}
