import { analyzeDocument } from '../../server/lib/analyzePdf.js'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const { text, fileName, lang } = await req.json()
    if (!text || typeof text !== 'string' || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Document text is required' }), { status: 400 })
    }
    const result = await analyzeDocument(text.trim(), fileName || 'document', lang || 'en')
    return new Response(JSON.stringify(result), { status: 200 })
  } catch (err) {
    console.error('PDF analysis error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to analyze document' }), { status: 500 })
  }
}

export const config = { path: '/api/analyze-pdf' }
