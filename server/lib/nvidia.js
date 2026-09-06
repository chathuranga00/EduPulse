import OpenAI from 'openai'

function getClient() {
  return new OpenAI({
    apiKey:  process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })
}

export async function nvidiaChat(messages, model) {
  const client = getClient()
  const completion = await client.chat.completions.create({
    model:       model || process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
    messages,
    temperature: 0.7,
    max_tokens:  2048,
  })
  return completion.choices[0]?.message?.content || ''
}
