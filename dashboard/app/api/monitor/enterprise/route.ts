import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get Enterprise plan users
        const { data: enterpriseUsers, error: entError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('plan_type', 'enterprise')

        if (entError) throw entError

        // Also get owner (who has enterprise access)
        const { data: ownerUsers } = await supabase
            .from('user_settings')
            .select('*')
            .or('plan_type.eq.owner,github_username.ilike.rishittandon7')

        const allEnterpriseUsers = [...(enterpriseUsers || []), ...(ownerUsers || [])]

        // Get active projects
        const { data: projects, error: projError } = await supabase
            .from('projects')
            .select('*')
            .eq('status', 'in_progress')

        if (projError) {
            // projects table might not exist
            console.log('Projects table error:', projError.message)
        }

        // Enhance projects with username
        const enhancedProjects = await Promise.all((projects || []).map(async (proj) => {
            const user = allEnterpriseUsers.find(u => u.id === proj.user_id)
            return {
                ...proj,
                username: user?.github_username || 'Unknown'
            }
        }))

        // Check for token issues
        const tokenIssues: any[] = []
        for (const user of allEnterpriseUsers) {
            if (!user.github_access_token) {
                tokenIssues.push({
                    username: user.github_username,
                    email: user.email,
                    error: 'No GitHub token'
                })
            }
        }

        // Today's commit count
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Count today's enterprise commits from projects table
        const commitsToday = enhancedProjects.reduce((sum, proj) => {
            // Check if project was updated today
            const updatedAt = new Date(proj.updated_at || proj.created_at)
            if (updatedAt >= today) {
                return sum + 1
            }
            return sum
        }, 0)

        return NextResponse.json({
            enterpriseUsers: allEnterpriseUsers.length,
            activeProjects: enhancedProjects.length,
            commitsToday,
            failedToday: 0, // Would need error logging to track
            projects: enhancedProjects,
            tokenIssues
        })

    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            enterpriseUsers: 0,
            activeProjects: 0,
            commitsToday: 0,
            failedToday: 0,
            projects: []
        }, { status: 500 })
    }
}
