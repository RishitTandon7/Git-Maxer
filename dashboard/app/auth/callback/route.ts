import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

// Create a service role client that bypasses RLS for database operations
function getServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing Supabase URL or Service Role Key')
        return null
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    // Log all cookies for debugging
    console.log('🍪 Auth Callback - Cookies received:', request.cookies.getAll().map(c => c.name))

    if (code) {
        // Create response that we'll modify with cookies
        let response = NextResponse.redirect(`${requestUrl.origin}/dashboard`)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                        cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: Record<string, unknown> }) => {
                            // Set cookie on the response
                            response.cookies.set(name, value, options as any)
                        })
                    },
                },
            }
        )

        // Exchange the code for a session
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

        if (sessionError) {
            console.error('❌ Session exchange error:', sessionError)
            return NextResponse.redirect(`${requestUrl.origin}/?error=auth_failed&details=${encodeURIComponent(sessionError.message)}`)
        }

        if (!sessionData?.session) {
            console.error('❌ No session data after code exchange')
            return NextResponse.redirect(`${requestUrl.origin}/?error=no_session`)
        }

        console.log('✅ Session created successfully:', {
            userId: sessionData.session.user.id,
            username: sessionData.session.user.user_metadata?.user_name,
            hasToken: !!sessionData.session.provider_token
        })

        // Capture the provider_token (GitHub access token) immediately
        const providerToken = sessionData.session.provider_token
        const userId = sessionData.session.user.id
        const githubUsername = sessionData.session.user.user_metadata?.user_name

        console.log('OAuth callback - userId:', userId, 'hasToken:', !!providerToken, 'username:', githubUsername)

        if (providerToken && userId) {
            const serviceClient = getServiceClient()

            if (serviceClient) {
                try {
                    // Try to UPDATE first (safest if user exists)
                    const { data, error: updateError } = await serviceClient
                        .from('user_settings')
                        .update({
                            github_access_token: providerToken,
                            github_username: githubUsername,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', userId)
                        .select('id')

                    if (!updateError && data && data.length > 0) {
                        console.log('✅ Existing user - token updated, redirecting to dashboard')
                        return response // Already set to redirect to dashboard
                    }

                    // If update failed (user doesn't exist), try INSERT
                    const { error: insertError } = await serviceClient
                        .from('user_settings')
                        .insert({
                            id: userId,
                            user_id: userId,
                            github_access_token: providerToken,
                            github_username: githubUsername || '',
                            repo_name: 'auto-contributions',
                            repo_visibility: 'public',
                            preferred_language: 'any',
                            min_contributions: 1,
                            pause_bot: true
                        })

                    if (insertError) {
                        console.error('Error creating user settings:', insertError)
                        // Still redirect to setup - they can complete setup there
                        response = NextResponse.redirect(`${requestUrl.origin}/setup?error=insert_failed`)
                        return response
                    }

                    console.log('✅ New user - settings created, redirecting to setup')
                    response = NextResponse.redirect(`${requestUrl.origin}/setup?new_user=true`)
                    return response

                } catch (dbError: any) {
                    console.error('Database error:', dbError)
                    response = NextResponse.redirect(`${requestUrl.origin}/setup?error=db_exception`)
                    return response
                }
            } else {
                console.error('Could not create service client')
                response = NextResponse.redirect(`${requestUrl.origin}/setup?error=service_client_failed`)
                return response
            }
        } else {
            console.warn('No provider_token or userId available')
            // Session exists but no token - still logged in, go to dashboard
            return response
        }
    }

    // No code parameter
    return NextResponse.redirect(`${requestUrl.origin}/?error=no_code`)
}
