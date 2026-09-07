import { generateQuiz } from '../../server/lib/generateQuiz.js'

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }
  try {
    const { subject, topic, questionCount, difficulty, lang } = await req.json()
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return new Response(JSON.stringify({ error: 'Subject is required' }), { status: 400 })
    }
    const quiz = await generateQuiz({
      subject:       subject.trim(),
      topic:         topic?.trim() || '',
      questionCount: Math.min(Math.max(Number(questionCount) || 10, 5), 30),
      difficulty:    difficulty || 'Medium',
      lang:          lang || 'en',
    })
    return new Response(JSON.stringify(quiz), { status: 200 })
  } catch (err) {
    console.error('Quiz error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to generate quiz' }), { status: 500 })
  }
}

export const config = { path: '/api/generate-quiz' }
