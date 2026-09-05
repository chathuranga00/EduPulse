import dotenv from 'dotenv'
dotenv.config()

// Test the key directly with raw fetch (no SDK)
const url  = process.env.SUPABASE_URL
const key  = process.env.SUPABASE_SERVICE_KEY

console.log('URL:', url)
console.log('Key prefix:', key?.slice(0, 20) + '...')
console.log('')

const res = await fetch(`${url}/rest/v1/users?select=count`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
  }
})

console.log('HTTP Status:', res.status)
const body = await res.text()
console.log('Response:', body)
