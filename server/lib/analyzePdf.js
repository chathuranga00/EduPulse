import { getNvidiaClient, getModel } from './nvidia.js'

const MAX_TEXT_LENGTH = 80000

const ANALYSIS_SYSTEM_PROMPT = `You are an expert academic document analyzer. Given document text, produce a thorough study aid.

Respond with ONLY valid JSON — no markdown fences, no commentary. Use this exact structure:
{
  "summary": "A multi-paragraph deep summary of the document",
  "keyConcepts": ["concept 1", "concept 2", ...],
  "flashcards": [
    { "front": "question", "back": "answer" }
  ]
}

Requirements:
- summary: 2-4 paragraphs covering the main themes and important details
- keyConcepts: 5-8 concise bullet-point strings
- flashcards: exactly 5 flashcards with clear question/answer pairs`

function parseAnalysisJson(raw) {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Model did not return valid JSON')
  }
  const parsed = JSON.parse(jsonMatch[0])

  if (!parsed.summary || !Array.isArray(parsed.keyConcepts) || !Array.isArray(parsed.flashcards)) {
    throw new Error('Invalid analysis response structure')
  }

  return {
    summary: String(parsed.summary),
    keyConcepts: parsed.keyConcepts.map(String),
    flashcards: parsed.flashcards.slice(0, 5).map((card) => ({
      front: String(card.front),
      back: String(card.back),
    })),
  }
}

export async function analyzeDocument(text, fileName = 'document') {
  const client = getNvidiaClient()

  let documentText = text.trim()
  if (!documentText) {
    throw new Error('No text could be extracted from the document')
  }

  if (documentText.length > MAX_TEXT_LENGTH) {
    documentText = documentText.slice(0, MAX_TEXT_LENGTH)
  }

  const response = await client.chat.completions.create({
    model: getModel(),
    max_tokens: 4096,
    messages: [
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analyze this document (${fileName}):\n\n${documentText}`,
      },
    ],
  })

  const responseText = response.choices?.[0]?.message?.content
  if (!responseText) {
    throw new Error('No text response from NVIDIA NIM')
  }

  return parseAnalysisJson(responseText)
}
