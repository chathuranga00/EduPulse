import { getNvidiaClient, getModel } from './nvidia.js'

const QUIZ_SYSTEM_PROMPT = `You are an expert Sri Lankan Advanced Level (A/L) examination paper setter with deep knowledge of the Sri Lanka Department of Examinations syllabus.

Generate a model A/L exam paper in strict JSON format. Questions must match the real A/L exam style:
- Multiple choice questions (MCQ) with exactly 4 options (A, B, C, D)
- Questions must be curriculum-accurate, exam-board level difficulty
- Cover a range of topics within the subject
- Vary cognitive levels: recall, application, analysis

Respond with ONLY valid JSON — no markdown, no commentary. Use this exact structure:
{
  "title": "descriptive paper title",
  "subject": "subject name",
  "duration": "XX minutes",
  "instructions": "brief exam instructions",
  "questions": [
    {
      "no": 1,
      "question": "question text",
      "options": {
        "A": "option A text",
        "B": "option B text",
        "C": "option C text",
        "D": "option D text"
      },
      "answer": "A",
      "explanation": "brief explanation of the correct answer"
    }
  ]
}`

function parseQuizJson(raw) {
  const trimmed = raw.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Model did not return valid JSON')

  const parsed = JSON.parse(jsonMatch[0])

  if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Invalid quiz response structure')
  }

  return {
    title:        String(parsed.title || 'A/L Model Paper'),
    subject:      String(parsed.subject || ''),
    duration:     String(parsed.duration || `${parsed.questions.length * 2} minutes`),
    instructions: String(parsed.instructions || 'Answer all questions. Each question carries 1 mark.'),
    questions:    parsed.questions.map((q, i) => ({
      no:          Number(q.no ?? i + 1),
      question:    String(q.question),
      options:     {
        A: String(q.options?.A ?? ''),
        B: String(q.options?.B ?? ''),
        C: String(q.options?.C ?? ''),
        D: String(q.options?.D ?? ''),
      },
      answer:      String(q.answer ?? 'A').toUpperCase(),
      explanation: String(q.explanation ?? ''),
    })),
  }
}

export async function generateQuiz({ subject, topic, questionCount = 10, difficulty = 'Medium' }) {
  const client = getNvidiaClient()

  const prompt = `Generate a Sri Lanka A/L model exam paper for the following:
Subject: ${subject}
Topic: ${topic || 'General — cover key syllabus areas'}
Number of questions: ${questionCount}
Difficulty: ${difficulty} (${
    difficulty === 'Easy'   ? 'straightforward recall and basic application' :
    difficulty === 'Hard'   ? 'advanced analysis, evaluation and challenging application' :
                              'balanced mix of recall and application'
  })

Produce exactly ${questionCount} MCQ questions in the JSON format specified.`

  const response = await client.chat.completions.create({
    model:      getModel(),
    max_tokens: 4096,
    messages: [
      { role: 'system', content: QUIZ_SYSTEM_PROMPT },
      { role: 'user',   content: prompt },
    ],
  })

  const text = response.choices?.[0]?.message?.content
  if (!text) throw new Error('No response from AI model')

  return parseQuizJson(text)
}
