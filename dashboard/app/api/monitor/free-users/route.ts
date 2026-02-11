import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get all free plan users with their emails
        const { data: freeUsers, error } = await supabase
            .from('user_settings')
            .select('id, github_username, email, created_at, last_commit_ts, pause_bot, plan_type')
            .or('plan_type.eq.free,plan_type.is.null')
            .order('created_at', { ascending: false })

        if (error) throw error

        // Also get user emails from auth table if available
        // Note: This requires service role key
        const { data: authUsers } = await supabase.auth.admin.listUsers()

        // Enhance with auth emails
        const enhancedUsers = (freeUsers || []).map(user => {
            const authUser = authUsers?.users?.find((au: any) => au.id === user.id)
            return {
                ...user,
                email: user.email || authUser?.email || 'No email'
            }
        })

        return NextResponse.json({
            users: enhancedUsers,
            count: enhancedUsers.length
        })

    } catch (error: any) {
        console.error('Free users fetch error:', error)
        return NextResponse.json({
            error: error.message,
            users: [],
            count: 0
        }, { status: 500 })
    }
}
