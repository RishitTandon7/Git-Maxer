import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get env vars with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only warn on client-side if env vars are missing at runtime
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('❌ Supabase env vars missing! Check your Vercel environment variables.')
}

// Client-side singleton to avoid stale connections & multiple instances headers
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

    // Client-side: use singleton
    if (!_supabase) {
        _supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        })
        console.log('🔵 Supabase Client Created (Singleton)')
    }
    return _supabase
}

// Legacy export - proxies to the same logic to ensure single instance on client
export const supabase = new Proxy({} as SupabaseClient, {
    get(_, prop) {
        return (getSupabaseClient() as any)[prop]
    }
})
