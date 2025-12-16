import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
        const { userId, providerToken, githubUsername } = await request.json()

        if (!userId || !providerToken) {
            return NextResponse.json(
                { error: 'Missing userId or providerToken' },
                { status: 400 }
            )
        }

        const serviceClient = getServiceClient()

        if (!serviceClient) {
            console.error('Missing Supabase service role key')
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            )
        }

        // Check if user settings exist
        const { data: existingSettings, error: fetchError } = await serviceClient
            .from('user_settings')
            .select('id, github_username')
            .eq('id', userId)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error fetching user settings:', fetchError)
        }

        if (existingSettings) {
            // Update existing record
            const settings = existingSettings as { id: string; github_username: string }
            const { error: updateError } = await serviceClient
                .from('user_settings')
                .update({
                    github_access_token: providerToken,
                    github_username: githubUsername || settings.github_username,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) {
                console.error('Error updating token:', updateError)
                return NextResponse.json(
                    { error: 'Failed to update token' },
                    { status: 500 }
                )
            }
        } else {
            // Create new record
            const { error: insertError } = await serviceClient
                .from('user_settings')
                .insert({
                    id: userId,
                    github_access_token: providerToken,
                    github_username: githubUsername || '',
                    repo_name: 'auto-contributions',
                    repo_visibility: 'public',
                    preferred_language: 'any',
                    min_contributions: 1,
                    pause_bot: true
                })

            if (insertError) {
                console.error('Error inserting settings:', insertError)
                return NextResponse.json(
                    { error: 'Failed to save token' },
                    { status: 500 }
                )
            }
        }

        console.log('Token stored successfully for user:', userId)
        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error in store-token API:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
