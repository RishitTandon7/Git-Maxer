import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env vars missing!')
}

// Create a fresh client each time to avoid stale connections
let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    if (typeof window === 'undefined') {
        // Server-side: always create fresh
        return createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        })
    }

    // Client-side: reuse singleton but ensure it's fresh
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        })
        console.log('🔵 Supabase Client Created')
    }
    return _supabase
}

// Legacy export for backward compatibility
export const supabase = typeof window !== 'undefined'
    ? getSupabaseClient()
    : createClient(
        supabaseUrl || 'https://placeholder.supabase.co',
        supabaseAnonKey || 'placeholder',
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    )

if (typeof window !== 'undefined') {
    console.log('🔵 Supabase Ready')
}
