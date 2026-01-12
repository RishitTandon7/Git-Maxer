import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Skip auth check for API routes and static files
    const path = request.nextUrl.pathname
    if (path.startsWith('/api/') || path.startsWith('/_next/')) {
        return NextResponse.next()
    }

    // Create response that can be modified
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        // Update request cookies
                        cookiesToSet.forEach(({ name, value }) => {
                            request.cookies.set(name, value)
                        })
                        // Create new response with updated cookies
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        // Set cookies on response
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        // CRITICAL: This refreshes the session and updates cookies
        // The getUser() call will refresh expired tokens automatically
        await supabase.auth.getUser()

    } catch (error) {
        // Don't block on auth errors - pages will handle their own auth
        console.error('Middleware auth error:', error)
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
         * - public files
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
