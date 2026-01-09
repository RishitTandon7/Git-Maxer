import { createBrowserClient } from '@supabase/ssr'

// For browser environments, these MUST be in next.config or .env with NEXT_PUBLIC_ prefix
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING')
}

// Use createBrowserClient from @supabase/ssr for proper PKCE support in Next.js
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
)

// Debug output for browser console
if (typeof window !== 'undefined') {
    console.log('🔵 Supabase SSR Client Initialized')
    console.log('URL:', supabaseUrl?.substring(0, 30) + '...')
    console.log('Has Key:', !!supabaseAnonKey)
}
