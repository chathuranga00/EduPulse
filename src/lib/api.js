// In production/mobile builds, set VITE_API_BASE_URL to your deployed backend URL.
// e.g. https://your-backend.railway.app
// Leave empty for local dev (uses relative paths via Vite dev server).
export const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export async function sendTutorMessage(message, history = []) {
  const data = await apiFetch('/api/tutor', {
    method: 'POST',
    body: JSON.stringify({ message, history }),
  })
  return data.text
}

export async function analyzeDocumentText(text, fileName) {
  return apiFetch('/api/analyze-pdf', {
    method: 'POST',
    body: JSON.stringify({ text, fileName }),
  })
}

export async function generateQuizPaper({ subject, topic, questionCount, difficulty }) {
  return apiFetch('/api/generate-quiz', {
    method: 'POST',
    body: JSON.stringify({ subject, topic, questionCount, difficulty }),
  })
}
