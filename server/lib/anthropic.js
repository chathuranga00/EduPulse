import Anthropic from '@anthropic-ai/sdk'
import dotenv from 'dotenv'

if (!process.env.ANTHROPIC_API_KEY) {
  dotenv.config()
}

let client = null

export function getAnthropicClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Add it to your .env file.')
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return client
}

export function getModel() {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'
}
