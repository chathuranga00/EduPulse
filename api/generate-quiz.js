import { generateQuiz } from '../server/lib/generateQuiz.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { subject, topic, questionCount, difficulty } = req.body

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' })
    }

    const quiz = await generateQuiz({
      subject: subject.trim(),
      topic:   topic?.trim() || '',
      questionCount: Math.min(Math.max(Number(questionCount) || 10, 5), 30),
      difficulty: difficulty || 'Medium',
    })

    res.status(200).json(quiz)
  } catch (err) {
    console.error('Generate quiz API error:', err)
    res.status(500).json({ error: err.message || 'Failed to generate quiz' })
  }
}
