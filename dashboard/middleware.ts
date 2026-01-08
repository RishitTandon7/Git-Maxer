import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet: any[]) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value)
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        // Add timeout wrapper to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Supabase Connection Timeout')), 5000)
        )

        // Refreshing session if expired - with timeout protection
        await Promise.race([
            supabase.auth.getUser(),
            timeoutPromise
        ]).catch(error => {
            // Log error but don't block the request
            console.error('Middleware auth check error:', error.message)
        })

    } catch (error: any) {
        // If auth check fails, still allow the request through
        // The actual auth will be checked on protected pages
        console.error('Middleware error:', error.message)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
