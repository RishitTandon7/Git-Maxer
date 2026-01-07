import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function runBotForUser(userId: string) {
    const logs: string[] = []

    try {
        // Get user settings
        const { data: userSettings, error: settingsError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .single()

        if (settingsError || !userSettings) {
            throw new Error('User settings not found')
        }

        if (userSettings.pause_bot) {
            return { success: false, message: 'Bot is paused', logs }
        }

        logs.push(`Processing user: ${userSettings.github_username}`)

        const githubToken = userSettings.github_access_token
        if (!githubToken) {
            throw new Error('GitHub token not found')
        }

        // Use GitHub API directly with fetch
        const repoName = userSettings.repo_name || 'auto-contributions'
        const fullRepoName = `${userSettings.github_username}/${repoName}`

        // Check if repo exists
        const checkResponse = await fetch(`https://api.github.com/repos/${fullRepoName}`, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github+json'
            }
        })

        if (checkResponse.status === 404) {
            // Create repo
            logs.push(`Creating repository ${fullRepoName}...`)
            const createResponse = await fetch('https://api.github.com/user/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: repoName,
                    description: 'Auto-generated contributions by GitMaxer',
                    private: userSettings.repo_visibility === 'private',
                    auto_init: true
                })
            })

            if (!createResponse.ok) {
                const errorData = await createResponse.json()
                throw new Error(`Failed to create repo: ${errorData.message}`)
            }

            logs.push(`✅ Repository created: ${fullRepoName}`)

            // Wait a bit for repo to be ready
            await new Promise(resolve => setTimeout(resolve, 2000))
        } else if (!checkResponse.ok) {
            throw new Error(`Failed to check repository: ${checkResponse.statusText}`)
        } else {
            logs.push(`Repository ${fullRepoName} exists`)
        }

        // Check today's commits
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const commitsResponse = await fetch(
            `https://api.github.com/repos/${fullRepoName}/commits?since=${today.toISOString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github+json'
                }
            }
        )

        const commits = await commitsResponse.json()
        const commitCount = Array.isArray(commits) ? commits.length : 0

        logs.push(`Today's commits: ${commitCount}`)

        const minContributions = userSettings.min_contributions || 1
        const neededCommits = Math.max(0, minContributions - commitCount)

        if (neededCommits === 0) {
            return {
                success: true,
                message: `Already have ${commitCount} commits today`,
                logs,
                commits: commitCount
            }
        }

        logs.push(`Creating ${neededCommits} commit(s)...`)

        // Generate content and create commits
        const { getRandomContent, getExtension } = await import('./content-generator')

        for (let i = 0; i < neededCommits; i++) {
            const language = userSettings.preferred_language || 'any'
            const content = getRandomContent(language)
            const fileExtension = getExtension(language)
            const timestamp = Date.now()
            const filename = `code_${timestamp}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

            // Create file via GitHub API
            const createFileResponse = await fetch(
                `https://api.github.com/repos/${fullRepoName}/contents/${filename}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${githubToken}`,
                        'Accept': 'application/vnd.github+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Add ${filename}`,
                        content: Buffer.from(content).toString('base64')
                    })
                }
            )

            if (!createFileResponse.ok) {
                const errorData = await createFileResponse.json()
                logs.push(`❌ Failed to create file: ${errorData.message}`)
                continue
            }

            logs.push(`✅ Created ${filename}`)

            // Log to database
            await supabase.from('commit_logs').insert({
                user_id: userId,
                repo_full_name: fullRepoName,
                language: language,
                content_snippet: content.substring(0, 100)
            })

            // Wait a bit between commits
            if (i < neededCommits - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }

        return {
            success: true,
            message: `Created ${neededCommits} commit(s) successfully`,
            logs,
            commits: neededCommits
        }

    } catch (error: any) {
        logs.push(`❌ Error: ${error.message}`)
        return {
            success: false,
            error: error.message,
            logs
        }
    }
}
