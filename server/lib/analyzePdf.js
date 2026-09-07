import OpenAI from 'openai'
import dotenv from 'dotenv'

if (!process.env.NVIDIA_API_KEY) dotenv.config()

const MAX_TEXT_LENGTH = 60000

const ANALYSIS_SYSTEM_PROMPT = `You are an expert academic document analyzer. Given document text, produce a thorough study aid.

Respond with ONLY valid JSON — no markdown fences, no commentary, no extra text. Use this exact structure:
{
  "summary": "A multi-paragraph deep summary of the document",
  "keyConcepts": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5"],
  "flashcards": [
    { "front": "question", "back": "answer" }
  ]
}

Requirements:
- summary: 2-4 paragraphs covering the main themes and important details
- keyConcepts: 5-8 concise bullet-point strings
- flashcards: exactly 5 flashcards with clear question/answer pairs`

function getLangInstruction(lang) {
  if (lang === 'si') return '\n\nIMPORTANT: Write ALL output (summary, keyConcepts, flashcards) in Sinhala (සිංහල) language only.'
  if (lang === 'ta') return '\n\nIMPORTANT: Write ALL output (summary, keyConcepts, flashcards) in Tamil (தமிழ்) language only.'
  return ''
}

function extractJson(raw) {
  if (!raw) return null
  const start = raw.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++
    else if (raw[i] === '}') { depth--; if (depth === 0) return raw.slice(start, i + 1) }
  }
  return raw.slice(start)
}

function parseAnalysisJson(raw) {
  const jsonStr = extractJson(raw)
  if (!jsonStr) throw new Error('Model did not return valid JSON')
  let parsed
  try { parsed = JSON.parse(jsonStr) } catch { throw new Error('Failed to parse analysis JSON') }
  if (!parsed.summary || !Array.isArray(parsed.keyConcepts) || !Array.isArray(parsed.flashcards)) {
    throw new Error('Invalid analysis response structure')
  }
  return {
    summary:     String(parsed.summary),
    keyConcepts: parsed.keyConcepts.map(String),
    flashcards:  parsed.flashcards.slice(0, 5).map((card) => ({
      front: String(card.front || ''),
      back:  String(card.back  || ''),
    })),
  }
}

export async function analyzeDocument(text, fileName = 'document', lang = 'en') {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured.')
  }

  // Use minimaxai/minimax-m3 — faster and better at JSON than gpt-oss-20b
  const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey:  process.env.NVIDIA_API_KEY,
  })

  let documentText = text.trim()
  if (!documentText) throw new Error('No text could be extracted from the document')
  if (documentText.length > MAX_TEXT_LENGTH) documentText = documentText.slice(0, MAX_TEXT_LENGTH)

  const systemPrompt = ANALYSIS_SYSTEM_PROMPT + getLangInstruction(lang)

  const response = await client.chat.completions.create({
    model:       'minimaxai/minimax-m3',
    max_tokens:  2048,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: `Analyze this document (${fileName}):\n\n${documentText}` },
    ],
  })

  const content  = response.choices?.[0]?.message?.content
  const raw = (content && content.trim()) ? content : response.choices?.[0]?.message?.reasoning_content
  if (!raw) throw new Error('No response from AI model')

  return parseAnalysisJson(raw)
}
