import { nvidiaChat } from './nvidia.js'

const SYSTEM_PROMPT = `You are EduPulse AI, a helpful and knowledgeable AI tutor for students.
You help students understand academic subjects, solve problems, and learn effectively.
Be clear, encouraging, and use examples when helpful. Format your responses with markdown.`

export async function chatWithTutor(message, history = []) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]
  return nvidiaChat(messages)
}
