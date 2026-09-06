import { nvidiaChat } from './nvidia.js'

export async function analyzeDocument(text, fileName = 'document') {
  const truncated = text.slice(0, 8000)

  const prompt = `Analyze the following document and provide:
1. A concise summary (2-3 paragraphs)
2. Key points (bullet list of 5-8 important points)
3. Main topics covered (list of topic names)

Document: "${fileName}"
Content:
${truncated}

Respond in JSON format:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "topics": ["topic1", "topic2", ...]
}`

  const raw = await nvidiaChat([{ role: 'user', content: prompt }])

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
  } catch { /* fall through */ }

  return {
    summary:   raw,
    keyPoints: [],
    topics:    [],
  }
}
