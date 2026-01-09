import { createClient } from '@supabase/supabase-js'

// For browser environments, these MUST be in next.config or .env with NEXT_PUBLIC_ prefix
// They get bundled at BUILD time, not runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'gitmacer-auth',
            debug: typeof window !== 'undefined' && window.location.hostname === 'localhost',
        },
        global: {
            headers: {
                'x-application-name': 'gitmacer',
            },
        },
        db: {
            schema: 'public',
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    }
)

// Debug output for browser console
if (typeof window !== 'undefined') {
    console.log('🔵 Supabase Client Initialized')
    console.log('URL:', supabaseUrl?.substring(0, 30) + '...')
    console.log('Has Key:', !!supabaseAnonKey)

    // Test if localStorage is available
    try {
        localStorage.setItem('test', '1')
        localStorage.removeItem('test')
        console.log('✅ LocalStorage available')
    } catch (e) {
        console.warn('⚠️ LocalStorage blocked (incognito mode?)')
    }
}
