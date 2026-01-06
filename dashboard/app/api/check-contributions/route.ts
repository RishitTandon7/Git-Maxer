import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get recent contribution history (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { data: history, error } = await supabase
            .from('generated_history')
            .select('*')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const byUser = history.reduce((acc: any, item: any) => {
            const userId = item.user_id
            if (!acc[userId]) {
                acc[userId] = []
            }
            acc[userId].push({
                date: new Date(item.created_at).toLocaleString(),
                language: item.language,
                filesCreated: item.files_created,
                success: item.success
            })
            return acc
        }, {})

        return NextResponse.json({
            message: 'Contribution History (Last 7 Days)',
            totalContributions: history.length,
            byUser: byUser,
            latestContribution: history[0] ? {
                userId: history[0].user_id,
                date: new Date(history[0].created_at).toLocaleString(),
                language: history[0].language,
                success: history[0].success
            } : 'No contributions yet',
            status: history.length > 0
                ? '✅ Bot is creating contributions'
                : '❌ No contributions in last 7 days - Bot may not be running'
        })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message
        }, { status: 500 })
    }
}
