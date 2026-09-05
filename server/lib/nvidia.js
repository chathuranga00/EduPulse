import OpenAI from 'openai'
import dotenv from 'dotenv'

if (!process.env.NVIDIA_API_KEY) {
  dotenv.config()
}

let client = null

export function getNvidiaClient() {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not configured. Add it to your .env file.')
  }
  if (!client) {
    client = new OpenAI({
      baseURL: 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_API_KEY,
    })
  }
  return client
}

export function getModel() {
  return process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct'
}
