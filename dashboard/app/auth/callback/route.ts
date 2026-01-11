import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Create a service role client that bypasses RLS for database operations
// This is needed because the route handler client has limited permissions in serverless environments
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

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
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
        // This token is ONLY available right after OAuth - it becomes null after refresh
        const providerToken = sessionData?.session?.provider_token
        const userId = sessionData?.session?.user?.id
        const githubUsername = sessionData?.session?.user?.user_metadata?.user_name

        console.log('OAuth callback - userId:', userId, 'hasToken:', !!providerToken, 'username:', githubUsername)

        if (providerToken && userId) {
            // Use service role client to bypass RLS for token storage
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
                        console.log('✅ Existing user - token updated')
                        return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
                    }

                    // If update failed (likely user doesn't exist), try INSERT
                    // We include both id and user_id to cover schema variations
                    const { error: insertError } = await serviceClient
                        .from('user_settings')
                        .insert({
                            id: userId,           // Key for RLS
                            user_id: userId,      // Legacy column support
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
                        // If insert failed, it might be because user_id column is missing or duplicate key
                        // Redirect to setup with debug info
                        return NextResponse.redirect(`${requestUrl.origin}/setup?error=insert_failed&details=${encodeURIComponent(insertError.message)}`)
                    }

                    console.log('✅ New user - settings created')
                    return NextResponse.redirect(`${requestUrl.origin}/setup?new_user=true`)

                } catch (dbError: any) {
                    console.error('Database error:', dbError)
                    return NextResponse.redirect(`${requestUrl.origin}/setup?error=db_exception&details=${encodeURIComponent(dbError.message || 'Unknown error')}`)
                }
            } else {
                console.error('Could not create service client')
                return NextResponse.redirect(`${requestUrl.origin}/setup?error=service_client_failed`)
            }
        } else {
            console.warn('No provider_token or userId available')
            return NextResponse.redirect(`${requestUrl.origin}/setup?error=missing_token`)
        }
    }

    // No code parameter - shouldn't happen but redirect to home
    return NextResponse.redirect(`${requestUrl.origin}/?error=no_code`)
}
