import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get LeetCode plan users
        const { data: leetcodeUsers, error: lcError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('plan_type', 'leetcode')

        if (lcError) throw lcError

        // Also get owner (who has leetcode access)
        const { data: ownerUsers } = await supabase
            .from('user_settings')
            .select('*')
            .or('plan_type.eq.owner,github_username.ilike.rishittandon7')

        const allLeetcodeUsers = [...(leetcodeUsers || []), ...(ownerUsers || [])]

        // Get recent LeetCode commits from generated_history
        const { data: recentHistory } = await supabase
            .from('generated_history')
            .select('*')
            .ilike('content_snippet', '%leetcode%')
            .order('created_at', { ascending: false })
            .limit(20)

        // Check for token issues - users with leetcode plan but bad tokens
        const tokenIssues: any[] = []
        for (const user of allLeetcodeUsers) {
            if (!user.github_access_token) {
                tokenIssues.push({
                    username: user.github_username,
                    email: user.email,
                    error: 'No GitHub token'
                })
            }
        }

        // Today's stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayHistory } = await supabase
            .from('generated_history')
            .select('*')
            .gte('created_at', today.toISOString())

        // Calculate success/fail counts
        const solvedToday = todayHistory?.filter(h =>
            h.content_snippet?.toLowerCase().includes('leetcode') &&
            !h.content_snippet?.includes('Error')
        ).length || 0

        const failedToday = todayHistory?.filter(h =>
            h.content_snippet?.includes('Error') ||
            h.content_snippet?.includes('failed')
        ).length || 0

        // Recent commits format
        const recentCommits = (recentHistory || []).map(h => ({
            username: h.user_id?.substring(0, 8) || 'Unknown',
            problemNumber: extractProblemNumber(h.content_snippet),
            title: extractTitle(h.content_snippet),
            timestamp: h.created_at
        }))

        return NextResponse.json({
            leetcodeUsers: allLeetcodeUsers.length,
            solvedToday,
            failedToday,
            apiHealth: 'OK', // Could test Gemini API here
            recentCommits,
            tokenIssues
        })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            leetcodeUsers: 0,
            solvedToday: 0,
            failedToday: 0,
            apiHealth: 'ERROR'
        }, { status: 500 })
    }
}

function extractProblemNumber(snippet: string): number {
    const match = snippet?.match(/Problem\s*#?(\d+)/i) || snippet?.match(/(\d+)\./i)
    return match ? parseInt(match[1]) : 0
}

function extractTitle(snippet: string): string {
    // Try to extract title from common patterns
    const match = snippet?.match(/Problem\s*#?\d+[:\s-]+([^\n]+)/i)
    return match ? match[1].trim().substring(0, 50) : 'Unknown Problem'
}
