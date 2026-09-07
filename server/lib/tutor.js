import { getNvidiaClient, getModel } from './nvidia.js'

const TUTOR_SYSTEM_PROMPT = `You are EduPulse, a friendly and structured study tutor for university students.

Your goals:
- Explain academic concepts clearly and accurately
- Use short paragraphs, bullet points, and numbered steps when helpful
- Break complex topics into manageable pieces
- Encourage the student with a warm, supportive tone
- Ask clarifying questions when the student's question is ambiguous
- Stay focused on educational content across all subjects

When comparing concepts, you may use clear side-by-side structure in prose.
End responses with an optional brief follow-up question or suggested next step when appropriate.`

function getLangInstruction(lang) {
  if (lang === 'si') return '\n\nIMPORTANT: You MUST respond entirely in Sinhala (සිංහල) language only.'
  if (lang === 'ta') return '\n\nIMPORTANT: You MUST respond entirely in Tamil (தமிழ்) language only.'
  return ''
}

export async function chatWithTutor(message, history = [], lang = 'en') {
  const client = getNvidiaClient()

  const systemContent = TUTOR_SYSTEM_PROMPT + getLangInstruction(lang)

  const messages = [
    { role: 'system', content: systemContent },
    ...history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  const response = await client.chat.completions.create({
    model:       getModel(),
    max_tokens:  2048,
    temperature: 0.7,
    messages,
  })

  const msg = response.choices?.[0]?.message
  // content is the normal response; reasoning_content is the thinking trace — use content first
  const text = (msg?.content && msg.content.trim()) ? msg.content : msg?.reasoning_content

  if (!text) throw new Error('No text response from NVIDIA NIM')

  return text
}
