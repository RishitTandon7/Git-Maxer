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

        // Get GitHub user info (need ID for proper email format)
        const userRes = await fetch('https://api.github.com/user', { headers })
        if (!userRes.ok) {
            console.error(`GitHub User Fetch Failed: ${userRes.status} ${userRes.statusText}`)
            return NextResponse.json({ error: `GitHub token invalid: ${userRes.status} ${userRes.statusText}` }, { status: 401 })
        }
        const githubUser = await userRes.json()
        const githubId = githubUser.id
        // ALWAYS use the ID-based noreply email as it's the most reliable for attribution
        const githubEmail = `${githubId}+${username}@users.noreply.github.com`

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

            // Create a realistic looking coding challenge solution
            const content = `class Solution:
    """
    Daily coding challenge solution.
    Problem: Optimize data processing pipeline
    Date: ${targetDate}
    """
    def process_data(self, data: list) -> list:
        # Optimization algorithm
        result = []
        seen = set()
        
        for item in data:
            if item not in seen:
                seen.add(item)
                result.append(item)
                
        return sorted(result)

    def validate_input(self, data):
        return data is not None and len(data) > 0

# Test cases
if __name__ == "__main__":
    sol = Solution()
    print(f"Processing complete at ${targetDate}T20:00:00Z")
`

            // Use a clean, realistic path
            const fileName = `challenges/challenge_${targetDate.replace(/-/g, '_')}.py`

            try {
                // Create date object for the target date (set to 8 PM for natural commit time)
                const commitDate = new Date(targetDate)
                commitDate.setHours(20, 0, 0, 0)

                const createRes = await fetch(`https://api.github.com/repos/${fullRepo}/contents/${fileName}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        message: `feat: Add solution for ${targetDate}`,
                        content: Buffer.from(content).toString('base64'),
                        committer: {
                            name: githubUser.name || username,
                            email: githubEmail,
                            date: commitDate.toISOString()
                        },
                        author: {
                            name: githubUser.name || username,
                            email: githubEmail,
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
            repo: fullRepo,
            emailUsed: githubEmail
        })

    } catch (error: any) {
        console.error('Admin contribute error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
