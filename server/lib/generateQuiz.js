import { nvidiaChat } from './nvidia.js'

export async function generateQuiz({ subject, topic, questionCount = 10, difficulty = 'Medium' }) {
  // Cap at 10 to avoid JSON truncation — user can take multiple rounds
  const count = Math.min(questionCount, 10)
  const prompt = `Generate ${count} multiple choice questions for an A/L student.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
Difficulty: ${difficulty}

Rules:
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)

Respond ONLY with this exact JSON structure, no extra text:
{
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ]
}`

  const raw = await nvidiaChat([{ role: 'user', content: prompt }])

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (parsed.questions && Array.isArray(parsed.questions)) return parsed
    }
  } catch { /* fall through */ }

  // Fallback structure if parsing fails
  return {
    questions: Array.from({ length: questionCount }, (_, i) => ({
      question:     `Sample question ${i + 1} about ${subject}`,
      options:      ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation:  'Generated question',
    })),
  }
}
