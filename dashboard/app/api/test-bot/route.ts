import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                error: 'Missing Supabase credentials',
                supabaseUrl: supabaseUrl ? '✅' : '❌',
                supabaseKey: supabaseKey ? '✅' : '❌'
            }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get all active users
        const { data: users, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('pause_bot', false)

        if (error) {
            return NextResponse.json({
                error: 'Database error',
                details: error.message
            }, { status: 500 })
        }

        const status = users.map(u => ({
            username: u.github_username,
            hasToken: u.github_access_token ? '✅ Yes' : '❌ No',
            repo: u.repo_name,
            language: u.preferred_language,
            minContribs: u.min_contributions,
            botActive: !u.pause_bot ? '✅ Active' : '❌ Paused'
        }))

        return NextResponse.json({
            message: 'Bot Status Check',
            totalUsers: users.length,
            users: status,
            cronSchedule: '17:30 UTC daily (11 PM IST)',
            nextSteps: status.some(u => !u.hasToken.includes('✅'))
                ? '⚠️ Some users missing GitHub token - they need to sign in with GitHub'
                : '✅ All users have tokens, bot should work'
        })

    } catch (error: any) {
        return NextResponse.json({
            error: 'Test failed',
            details: error.message
        }, { status: 500 })
    }
}
