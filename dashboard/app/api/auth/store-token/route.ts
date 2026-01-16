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
        const { userId, providerToken, username } = await request.json()

        if (!userId || !providerToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = getServiceClient()

        // Check if user exists
        const { data: existing } = await supabase
            .from('user_settings')
            .select('id')
            .eq('id', userId)
            .single()

        if (existing) {
            // Update existing user
            await supabase
                .from('user_settings')
                .update({
                    github_access_token: providerToken,
                    github_username: username,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
        } else {
            // Create new user
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

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Store token error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
