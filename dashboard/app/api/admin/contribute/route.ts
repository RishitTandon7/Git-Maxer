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

// Manual contribution trigger for a specific user and date
export async function POST(request: Request) {
    try {
        const { userId, username, date, backfillDays } = await request.json()

        if (!userId || !username) {
            return NextResponse.json({ error: 'Missing userId or username' }, { status: 400 })
        }

        const supabase = getServiceClient()

        // Get user's GitHub token
        const { data: user, error: userError } = await supabase
            .from('user_settings')
            .select('github_access_token, repo_name')
            .eq('id', userId)
            .single()

        if (userError || !user?.github_access_token) {
            return NextResponse.json({ error: 'User not found or no GitHub token' }, { status: 404 })
        }

        const headers = {
            'Authorization': `token ${user.github_access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }

        const repoName = user.repo_name || 'auto-contributions'
        const fullRepo = `${username}/${repoName}`

        // Check if repo exists
        const repoRes = await fetch(`https://api.github.com/repos/${fullRepo}`, { headers })
        if (!repoRes.ok) {
            return NextResponse.json({ error: `Repository ${fullRepo} not found` }, { status: 404 })
        }

        let commitsCreated = 0
        const days = backfillDays || 1

        // Create contributions for each day
        for (let i = days - 1; i >= 0; i--) {
            const targetDateObj = new Date()
            targetDateObj.setDate(targetDateObj.getDate() - i)
            const targetDate = date && i === 0 ? date : targetDateObj.toISOString().split('T')[0]

            const content = `# ${backfillDays ? 'Backfill' : 'Manual'} Contribution
# Date: ${targetDate}
# User: ${username}
# Triggered by: Admin (God Mode)

def contribution_${targetDate.replace(/-/g, '_')}():
    """
    This contribution was ${backfillDays ? 'backfilled' : 'manually triggered'} by the admin.
    GitMaxer - Keep your streak alive!
    """
    print("${backfillDays ? 'Backfill' : 'Manual'} contribution from GitMaxer Admin")
    return True

# Generated at: ${new Date().toISOString()}
`

            const fileName = `${backfillDays ? 'backfill' : 'manual'}/${targetDate}_${Date.now()}.py`

            try {
                // Create date object for the target date (set to 8 PM for natural commit time)
                const commitDate = new Date(targetDate)
                commitDate.setHours(20, 0, 0, 0)

                const createRes = await fetch(`https://api.github.com/repos/${fullRepo}/contents/${fileName}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        message: `feat: ${backfillDays ? 'Backfill' : 'Manual'} contribution for ${targetDate}`,
                        content: Buffer.from(content).toString('base64'),
                        committer: {
                            name: 'GitMaxer Bot',
                            email: 'bot@gitmaxer.com',
                            date: commitDate.toISOString()
                        },
                        author: {
                            name: username,
                            email: `${username}@users.noreply.github.com`,
                            date: commitDate.toISOString()
                        }
                    })
                })

                if (createRes.ok) {
                    commitsCreated++
                }
            } catch (e) {
                // Skip failed commits
            }
        }

        // Update last_commit_ts
        await supabase.from('user_settings').update({
            last_commit_ts: new Date().toISOString(),
            daily_commit_count: 0
        }).eq('id', userId)

        return NextResponse.json({
            success: true,
            message: `Created ${commitsCreated} contribution(s) for ${username}`,
            commitsCreated,
            repo: fullRepo
        })

    } catch (error: any) {
        console.error('Admin contribute error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
