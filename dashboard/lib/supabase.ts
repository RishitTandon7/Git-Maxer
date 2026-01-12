import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env vars missing!')
}

// Use standard createClient - stores auth in localStorage
// This avoids PKCE cookie issues with SSR
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            flowType: 'implicit', // Use implicit flow instead of PKCE
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
    }
)

if (typeof window !== 'undefined') {
    console.log('🔵 Supabase Client Ready (Implicit Flow)')
}
