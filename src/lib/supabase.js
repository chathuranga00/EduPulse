import { createClient } from '@supabase/supabase-js'

// Hardcoded for reliability — anon key is safe to expose in browser
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || 'https://suqivyjlptyelgrysmvo.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cWl2eWpscHR5ZWxncnlzbXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTI0NjAsImV4cCI6MjEwNDE4ODQ2MH0._yb5YA8r-FH7_sBdlIBQNdT1IuU-_Bvc2Jf7TinS3Zk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
