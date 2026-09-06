import { nvidiaChat } from './nvidia.js'

export async function generateQuiz({ subject, topic, questionCount = 10, difficulty = 'Medium' }) {
  const prompt = `Generate ${questionCount} multiple choice questions for an A/L student.
Subject: ${subject}
${topic ? `Topic: ${topic}` : ''}
Difficulty: ${difficulty}

Each question must have exactly 4 options and one correct answer.

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation"
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
