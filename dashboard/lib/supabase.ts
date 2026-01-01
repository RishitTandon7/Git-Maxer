import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Ensure we never pass undefined/empty to createBrowserClient during build
const finalUrl = supabaseUrl && supabaseUrl.length > 0 ? supabaseUrl : 'https://placeholder.supabase.co'
const finalKey = supabaseAnonKey && supabaseAnonKey.length > 0 ? supabaseAnonKey : 'placeholder'

export const supabase = createBrowserClient(finalUrl, finalKey)
