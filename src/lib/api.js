const BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function sendTutorMessage(message, history = [], lang = 'en') {
  const res = await fetch(`${BASE}/api/tutor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, lang }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to get tutor response')
  }
  return data.text
}

export async function analyzeDocumentText(text, fileName, lang = 'en') {
  const res = await fetch(`${BASE}/api/analyze-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, fileName, lang }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to analyze document')
  }
  return data
}

export async function generateQuizPaper({ subject, topic, questionCount, difficulty, lang = 'en' }) {
  const res = await fetch(`${BASE}/api/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, topic, questionCount, difficulty, lang }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate quiz')
  }
  return data
}
