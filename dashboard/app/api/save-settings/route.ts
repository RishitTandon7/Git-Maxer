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
        const body = await request.json()

        // Get user ID from request
        const userId = body.id || body.user_id

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }

        // Use service client to verify user exists
        const serviceClient = getServiceClient()
        if (!serviceClient) {
            return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
        }

        // Verify this user exists in auth.users
        const { data: authUser, error: authError } = await serviceClient.auth.admin.getUserById(userId)

        if (authError || !authUser) {
            console.error('User verification failed:', authError)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('✅ User verified:', userId)

        // 2. Validate/Prepare Data
        // Ensure we only touch the authenticated user's data
        const settingsData: Record<string, any> = {
            id: userId,          // Primary key - same as auth user id
            user_id: userId,     // Foreign key - references auth.users.id
            github_username: body.github_username,
            repo_name: body.repo_name,
            repo_visibility: body.repo_visibility,
            preferred_language: body.preferred_language,
            commit_time: body.commit_time,
            min_contributions: body.min_contributions,
            pause_bot: body.pause_bot,
            plan_type: 'free',    // Default plan for new users
            is_paid: false        // Default to unpaid
        }

        // Include GitHub token if provided
        if (body.github_access_token) {
            settingsData.github_access_token = body.github_access_token
        }

        // 3. Check if this is a new user by querying existing settings
        const { data: existing } = await serviceClient
            .from('user_settings')
            .select('plan_type, is_paid')
            .eq('id', userId)
            .single()

        // If user already exists, preserve their plan and paid status (don't overwrite with free)
        if (existing) {
            delete settingsData.plan_type
            delete settingsData.is_paid
        }

        // Upsert matches on primary key 'id'
        const { error: upsertError } = await serviceClient
            .from('user_settings')
            .upsert(settingsData, { onConflict: 'id' })

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
