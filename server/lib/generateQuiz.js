import { getNvidiaClient, getModel } from './nvidia.js'

const QUIZ_SYSTEM_PROMPT = `You are an expert Sri Lankan Advanced Level (A/L) examination paper setter with deep knowledge of the Sri Lanka Department of Examinations syllabus.

Generate a model A/L exam paper in strict JSON format. Questions must match the real A/L exam style:
- Multiple choice questions (MCQ) with exactly 4 options (A, B, C, D)
- Questions must be curriculum-accurate, exam-board level difficulty
- Cover a range of topics within the subject
- Vary cognitive levels: recall, application, analysis

Respond with ONLY valid JSON — no markdown fences, no commentary, no extra text before or after. Use this exact structure:
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

function getLangInstruction(lang) {
  if (lang === 'si') return '\n\nIMPORTANT: Write ALL question text, options, explanations, title, and instructions in Sinhala (සිංහල) language only.'
  if (lang === 'ta') return '\n\nIMPORTANT: Write ALL question text, options, explanations, title, and instructions in Tamil (தமிழ்) language only.'
  return ''
}

function extractJson(raw) {
  if (!raw) return null
  const start = raw.indexOf('{')
  if (start === -1) return null
  let depth = 0
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === '{') depth++
    else if (raw[i] === '}') {
      depth--
      if (depth === 0) return raw.slice(start, i + 1)
    }
  }
  return raw.slice(start)
}

function parseQuizJson(raw) {
  const jsonStr = extractJson(raw)
  if (!jsonStr) throw new Error('Model did not return valid JSON')

  let parsed
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('Failed to parse quiz JSON from model response')
  }

  if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error('Invalid quiz response: no questions found')
  }

  return {
    title:        String(parsed.title || 'A/L Model Paper'),
    subject:      String(parsed.subject || ''),
    duration:     String(parsed.duration || `${parsed.questions.length * 2} minutes`),
    instructions: String(parsed.instructions || 'Answer all questions. Each question carries 1 mark.'),
    questions:    parsed.questions.map((q, i) => ({
      no:          Number(q.no ?? i + 1),
      question:    String(q.question || ''),
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

export async function generateQuiz({ subject, topic, questionCount = 10, difficulty = 'Medium', lang = 'en' }) {
  // Use minimax-m3 for quiz — faster and better at structured JSON than gpt-oss-20b
  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
  })

  const systemPrompt = QUIZ_SYSTEM_PROMPT + getLangInstruction(lang)

  const diffDesc =
    difficulty === 'Easy' ? 'straightforward recall and basic application' :
    difficulty === 'Hard' ? 'advanced analysis, evaluation and challenging application' :
                            'balanced mix of recall and application'

  const prompt = `Generate a Sri Lanka A/L model exam paper:
Subject: ${subject}
Topic: ${topic || 'General — cover key syllabus areas'}
Number of questions: ${questionCount}
Difficulty: ${difficulty} (${diffDesc})

Produce exactly ${questionCount} MCQ questions. Output ONLY the JSON object, nothing else.`

  const response = await client.chat.completions.create({
    model:       'minimaxai/minimax-m3',
    max_tokens:  Math.max(4096, questionCount * 350),
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: prompt },
    ],
  })

  const content = response.choices?.[0]?.message?.content
  const reasoning = response.choices?.[0]?.message?.reasoning_content
  const raw = (content && content.trim()) ? content : reasoning

  if (!raw) throw new Error('No response from AI model')

  return parseQuizJson(raw)
}
