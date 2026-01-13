import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get env vars with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only warn on client-side if env vars are missing at runtime
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('❌ Supabase env vars missing! Check your Vercel environment variables.')
}

// Create a fresh client each time to avoid stale connections
let _supabase: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
    // Guard against missing env vars
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing. Please check environment variables.')
    }

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

// Legacy export for backward compatibility - lazy initialization
let _legacySupabase: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        if (!_legacySupabase) {
            if (!supabaseUrl || !supabaseAnonKey) {
                throw new Error('Supabase configuration missing')
            }
            _legacySupabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    persistSession: typeof window !== 'undefined',
                    autoRefreshToken: typeof window !== 'undefined',
                    detectSessionInUrl: typeof window !== 'undefined',
                },
            })
            if (typeof window !== 'undefined') {
                console.log('🔵 Supabase Ready')
            }
        }
        return (_legacySupabase as any)[prop]
    }
})
