import { getNvidiaClient, getModel } from './nvidia.js'

const TUTOR_SYSTEM_PROMPT = `You are EduPulse AI, a friendly and structured study tutor for university students.

Your goals:
- Explain academic concepts clearly and accurately
- Use short paragraphs, bullet points, and numbered steps when helpful
- Break complex topics into manageable pieces
- Encourage the student with a warm, supportive tone
- Ask clarifying questions when the student's question is ambiguous
- Stay focused on educational content across all subjects

When comparing concepts, you may use clear side-by-side structure in prose.
End responses with an optional brief follow-up question or suggested next step when appropriate.`

export async function chatWithTutor(message, history = []) {
  const client = getNvidiaClient()

  const messages = [
    { role: 'system', content: TUTOR_SYSTEM_PROMPT },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  const response = await client.chat.completions.create({
    model: getModel(),
    max_tokens: 2048,
    messages,
  })

  const text = response.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('No text response from NVIDIA NIM')
  }

  return text
}
