import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase env vars missing!')
}

// Use createBrowserClient with explicit cookie options for PKCE flow
// This ensures the code verifier is stored in cookies readable by the server
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        cookies: {
            // Use default browser cookie handling
            // This is required for PKCE flow to work correctly
        },
        cookieOptions: {
            // Ensure cookies are accessible across the site
            path: '/',
            sameSite: 'lax',
            secure: typeof window !== 'undefined' && window.location.protocol === 'https:'
        }
    }
)

if (typeof window !== 'undefined') {
    console.log('🔵 Supabase Browser Client Ready')
}
