import { createBrowserClient } from '@supabase/ssr'

// For browser environments
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables missing!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'EXISTS' : 'MISSING')
}

// Use createBrowserClient with proper cookie handling for Next.js
export const supabase = createBrowserClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        cookies: {
            get(name: string) {
                if (typeof document === 'undefined') return undefined
                const value = `; ${document.cookie}`
                const parts = value.split(`; ${name}=`)
                if (parts.length === 2) return parts.pop()?.split(';').shift()
            },
            set(name: string, value: string, options: any) {
                if (typeof document === 'undefined') return
                let cookie = `${name}=${value}`
                if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
                if (options?.path) cookie += `; path=${options.path}`
                if (options?.domain) cookie += `; domain=${options.domain}`
                if (options?.secure) cookie += '; secure'
                if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
                document.cookie = cookie
            },
            remove(name: string, options: any) {
                if (typeof document === 'undefined') return
                this.set(name, '', { ...options, maxAge: 0 })
            },
        },
    }
)

// Debug output
if (typeof window !== 'undefined') {
    console.log('🔵 Supabase SSR Client Initialized')
    console.log('URL:', supabaseUrl?.substring(0, 30) + '...')
    console.log('Has Key:', !!supabaseAnonKey)
}
