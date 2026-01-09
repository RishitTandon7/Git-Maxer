import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING')
}

// Simple client without PKCE - more compatible with Next.js
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            // Disable PKCE to avoid verifier storage issues
            flowType: 'implicit',
        },
    }
)

if (typeof window !== 'undefined') {
    console.log('🔵 Supabase Client Initialized (Implicit Flow)')
    console.log('URL:', supabaseUrl?.substring(0, 30) + '...')
    console.log('Has Key:', !!supabaseAnonKey)
}
