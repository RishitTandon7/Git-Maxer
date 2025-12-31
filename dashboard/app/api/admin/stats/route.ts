import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
    try {
        // 1. Total Users
        const { count: totalUsers } = await supabaseAdmin
            .from('user_settings')
            .select('*', { count: 'exact', head: true })

        // Date calculations
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        // 2. Active Users (24h)
        const { data: activeData } = await supabaseAdmin
            .from('analytics')
            .select('user_id')
            .gte('created_at', yesterday)
        const activeUsers = new Set(activeData?.map(d => d.user_id).filter(Boolean)).size

        // 3. Opened Today (Analytics count since midnight)
        const { count: openedToday } = await supabaseAdmin
            .from('analytics')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)

        // 4. Commits Generated Today (Generated History count since midnight)
        const { count: commitsToday } = await supabaseAdmin
            .from('generated_history')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)

        // 5. Total Revenue & Plan Stats
        const { data: plans } = await supabaseAdmin
            .from('user_settings')
            .select('plan_type')

        let totalRevenue = 0
        plans?.forEach((user: any) => {
            if (user.plan_type === 'pro') totalRevenue += 10
            if (user.plan_type === 'enterprise') totalRevenue += 50
        })

        // 6. Recent Users
        const { data: recentUsers } = await supabaseAdmin
            .from('user_settings')
            .select('user_id, github_username, plan_type, created_at')
            .order('created_at', { ascending: false })
            .limit(10)

        // 7. Recent Logs
        const { data: recentLogs } = await supabaseAdmin
            .from('generated_history')
            .select('created_at, content_snippet, language')
            .order('created_at', { ascending: false })
            .limit(10)

        return NextResponse.json({
            liveUsers: activeUsers || 0,
            totalUsers: totalUsers || 0,
            openedToday: openedToday || 0,
            commitsToday: commitsToday || 0,
            totalRevenue: totalRevenue * 80, // INR conversion
            recentUsers: recentUsers || [],
            recentLogs: recentLogs || []
        })

    } catch (error) {
        console.error("Admin stats fetch error:", error)
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 })
    }
}
