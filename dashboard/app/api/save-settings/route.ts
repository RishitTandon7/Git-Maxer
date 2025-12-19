import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create a service role client that bypasses RLS
function getServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        return null
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verify Authentication
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: any[]) {
                        // We don't need to set cookies here, just read them for auth
                    },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // 2. Validate/Prepare Data
        // Ensure we only touch the authenticated user's data
        const settingsData = {
            id: user.id, // Force ID to match authenticated user
            user_id: user.id, // Add explicit user_id for DB compatibility
            github_username: body.github_username,
            repo_name: body.repo_name,
            repo_visibility: body.repo_visibility,
            preferred_language: body.preferred_language,
            commit_time: body.commit_time,
            min_contributions: body.min_contributions,
            pause_bot: body.pause_bot
        }

        // If a token is provided in the body (e.g. passed from session on client), include it
        // Note: Ideally we should rely on what's already in DB, but sometimes we need to update it
        if (body.github_access_token) {
            (settingsData as any).github_access_token = body.github_access_token
        }

        // 3. Perform DB Operation using Service Client
        const serviceClient = getServiceClient()
        if (!serviceClient) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
        }

        // Check if row exists to decide Upsert vs Update (or just Upsert)
        // Upsert is easiest
        const { error: upsertError } = await serviceClient
            .from('user_settings')
            .upsert(settingsData)

        if (upsertError) {
            console.error('Database error saving settings:', upsertError)
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Error in save-settings API:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
