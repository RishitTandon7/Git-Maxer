import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
}

export async function POST(request: Request) {
    try {
        const { userId, providerToken, username, provider } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        const supabase = getServiceClient()

        // Check if user exists
        const { data: existing } = await supabase
            .from('user_settings')
            .select('id')
            .eq('id', userId)
            .single()

        let isNewUser = false

        if (existing) {
            // Update existing user (only if token is provided)
            if (providerToken) {
                await supabase
                    .from('user_settings')
                    .update({
                        github_access_token: providerToken,
                        github_username: username,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId)
            }
        } else {
            // NEW USER LOGIC
            // If provider is Google, REJECT signup
            if (provider === 'google') {
                return NextResponse.json({ error: 'Google signups are disabled. Please use GitHub.', isNewUser: true, rejected: true }, { status: 403 })
            }

            // Otherwise create new user (GitHub)
            if (!providerToken) {
                // Even if GitHub, we need token to create account properly
                return NextResponse.json({ error: 'Missing GitHub token' }, { status: 400 })
            }

            isNewUser = true
            await supabase
                .from('user_settings')
                .upsert({
                    id: userId,
                    user_id: userId,
                    github_access_token: providerToken,
                    github_username: username || '',
                    repo_name: 'auto-contributions',
                    repo_visibility: 'public',
                    preferred_language: 'any',
                    min_contributions: 1,
                    pause_bot: true
                }, { onConflict: 'id' })
        }

        return NextResponse.json({ success: true, isNewUser })
    } catch (error: any) {
        console.error('Store token error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
