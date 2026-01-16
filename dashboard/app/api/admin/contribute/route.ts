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

// Helper function to create a backdated commit using Git Data API
async function createBackdatedCommit(
    headers: Record<string, string>,
    fullRepo: string,
    fileName: string,
    content: string,
    message: string,
    authorName: string,
    authorEmail: string,
    targetDate: Date
): Promise<boolean> {
    try {
        // 1. Get the default branch
        const repoRes = await fetch(`https://api.github.com/repos/${fullRepo}`, { headers })
        if (!repoRes.ok) return false
        const repoData = await repoRes.json()
        const defaultBranch = repoData.default_branch || 'main'

        // 2. Get the latest commit SHA on the default branch
        const refRes = await fetch(`https://api.github.com/repos/${fullRepo}/git/refs/heads/${defaultBranch}`, { headers })
        if (!refRes.ok) return false
        const refData = await refRes.json()
        const latestCommitSha = refData.object.sha

        // 3. Get the tree SHA from the latest commit
        const commitRes = await fetch(`https://api.github.com/repos/${fullRepo}/git/commits/${latestCommitSha}`, { headers })
        if (!commitRes.ok) return false
        const commitData = await commitRes.json()
        const baseTreeSha = commitData.tree.sha

        // 4. Create a blob with the file content
        const blobRes = await fetch(`https://api.github.com/repos/${fullRepo}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content: Buffer.from(content).toString('base64'),
                encoding: 'base64'
            })
        })
        if (!blobRes.ok) return false
        const blobData = await blobRes.json()
        const blobSha = blobData.sha

        // 5. Create a new tree with the blob
        const treeRes = await fetch(`https://api.github.com/repos/${fullRepo}/git/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: [{
                    path: fileName,
                    mode: '100644',
                    type: 'blob',
                    sha: blobSha
                }]
            })
        })
        if (!treeRes.ok) return false
        const treeData = await treeRes.json()
        const newTreeSha = treeData.sha

        // 6. Create a commit with the custom date
        const dateString = targetDate.toISOString()
        const newCommitRes = await fetch(`https://api.github.com/repos/${fullRepo}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message,
                tree: newTreeSha,
                parents: [latestCommitSha],
                author: {
                    name: authorName,
                    email: authorEmail,
                    date: dateString
                },
                committer: {
                    name: authorName,
                    email: authorEmail,
                    date: dateString
                }
            })
        })
        if (!newCommitRes.ok) return false
        const newCommitData = await newCommitRes.json()
        const newCommitSha = newCommitData.sha

        // 7. Update the ref to point to the new commit
        const updateRefRes = await fetch(`https://api.github.com/repos/${fullRepo}/git/refs/heads/${defaultBranch}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                sha: newCommitSha,
                force: false
            })
        })

        return updateRefRes.ok
    } catch (e) {
        console.error('Error creating backdated commit:', e)
        return false
    }
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
            console.error('User lookup failed:', { userId, userError })
            return NextResponse.json({
                error: 'User not found or no GitHub token',
                details: userError?.message || 'No token in database',
                userId
            }, { status: 404 })
        }

        const headers: Record<string, string> = {
            'Authorization': `token ${user.github_access_token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }

        // Get GitHub user info (need ID for proper email format)
        let githubEmail = `${username}@users.noreply.github.com`
        let githubName = username

        try {
            const userRes = await fetch('https://api.github.com/user', { headers })
            if (userRes.ok) {
                const githubUser = await userRes.json()
                const githubId = githubUser.id
                githubName = githubUser.name || username
                // Preferred: ID-based immutable email
                githubEmail = `${githubId}+${username}@users.noreply.github.com`
            } else {
                console.warn(`Could not fetch GitHub user details: ${userRes.status}. Using fallback email.`)
            }
        } catch (e) {
            console.warn('Error fetching GitHub user:', e)
        }

        const repoName = user.repo_name || 'auto-contributions'
        const fullRepo = `${username}/${repoName}`

        // Check if repo exists
        const repoRes = await fetch(`https://api.github.com/repos/${fullRepo}`, { headers })
        if (!repoRes.ok) {
            console.error('Repo not found:', { fullRepo, status: repoRes.status })
            return NextResponse.json({
                error: `Repository ${fullRepo} not found`,
                status: repoRes.status,
                hint: 'Repo may be private or not created yet'
            }, { status: 404 })
        }

        let commitsCreated = 0
        const days = backfillDays || 1

        // Create contributions for each day
        for (let i = days - 1; i >= 0; i--) {
            const targetDateObj = new Date()
            targetDateObj.setDate(targetDateObj.getDate() - i)
            const targetDateStr = date && i === 0 ? date : targetDateObj.toISOString().split('T')[0]

            // Create a realistic looking coding challenge solution
            const content = `class Solution:
    """
    Daily coding challenge solution.
    Problem: Optimize data processing pipeline
    Date: ${targetDateStr}
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
    print(f"Processing complete at ${targetDateStr}T20:00:00Z")
`

            // Use a clean, realistic path with unique timestamp to avoid conflicts
            const fileName = `challenges/challenge_${targetDateStr.replace(/-/g, '_')}_${Date.now()}.py`

            // Create date object for the target date (set to 8 PM for natural commit time)
            const commitDate = new Date(targetDateStr)
            commitDate.setHours(20, 0, 0, 0)

            const success = await createBackdatedCommit(
                headers,
                fullRepo,
                fileName,
                content,
                `feat: Add solution for ${targetDateStr}`,
                githubName,
                githubEmail,
                commitDate
            )

            if (success) {
                commitsCreated++
            }
        }

        // Update last_commit_ts
        await supabase.from('user_settings').update({
            last_commit_ts: new Date().toISOString(),
            daily_commit_count: 0
        }).eq('id', userId)

        return NextResponse.json({
            success: commitsCreated > 0,
            message: `Created ${commitsCreated} backdated contribution(s) for ${username}`,
            commitsCreated,
            repo: fullRepo,
            emailUsed: githubEmail
        })

    } catch (error: any) {
        console.error('Admin contribute error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
