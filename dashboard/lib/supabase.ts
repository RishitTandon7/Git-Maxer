import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env vars missing!')
}

// Use createBrowserClient for proper cookie handling with Next.js App Router
// This automatically syncs with cookies set by server-side auth
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
)

if (typeof window !== 'undefined') {
    console.log('🔵 Supabase Browser Client Ready')
}
