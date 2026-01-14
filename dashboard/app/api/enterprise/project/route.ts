import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase config')
    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

export async function POST(req: Request) {
    try {
        const { userId, projectName, repoName, projectDescription, techStack, githubToken: clientToken } = await req.json()

        // Verify user has Enterprise plan
        const { data: user, error: userError } = await getSupabase()
            .from('user_settings')
            .select('plan_type, github_username, github_access_token')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (user.plan_type !== 'enterprise' && user.plan_type !== 'owner') {
            return NextResponse.json({ error: 'Enterprise plan required' }, { status: 403 })
        }

        // Check if user already has an active project
        const { data: activeProject } = await getSupabase()
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'in_progress')
            .single()

        if (activeProject) {
            return NextResponse.json({
                error: 'You already have an active project in progress',
                project: activeProject
            }, { status: 400 })
        }

        // Use provided repo name or generate fallback
        const finalRepoName = repoName ? repoName.toLowerCase().replace(/[^a-z0-9-_]+/g, '-') : projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

        // Check if GitHub repo exists and create if needed
        try {
            // Prioritize client-provided token, fallback to database
            const githubToken = clientToken || user.github_access_token
            console.log('GitHub token source:', clientToken ? 'client' : 'database')

            if (!githubToken) {
                return NextResponse.json({
                    error: 'GitHub token not found. Please log out and log back in to refresh your authentication.'
                }, { status: 400 })
            }

            // Get authenticated user
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })

            if (!userResponse.ok) {
                const errorText = await userResponse.text()
                console.error('GitHub auth failed:', userResponse.status, errorText)
                throw new Error(`GitHub authentication failed: ${userResponse.status} - ${errorText}`)
            }

            const githubUser = await userResponse.json()
            const fullRepoName = `${githubUser.login}/${finalRepoName}`

            // Check if repo exists
            const checkResponse = await fetch(`https://api.github.com/repos/${fullRepoName}`, {
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            })

            if (checkResponse.status === 404) {
                // Repo doesn't exist - create it (90% case)
                console.log(`Creating repository ${fullRepoName}...`)

                const createResponse = await fetch('https://api.github.com/user/repos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${githubToken}`,
                        'Accept': 'application/vnd.github+json',
                        'X-GitHub-Api-Version': '2022-11-28'
                    },
                    body: JSON.stringify({
                        name: finalRepoName,
                        description: `${projectName} - AI-generated project by GitMaxer Enterprise`,
                        private: false,
                        auto_init: true
                    })
                })

                if (!createResponse.ok) {
                    const errorData = await createResponse.json()
                    throw new Error(errorData.message || 'Failed to create repository')
                }

                console.log(`✅ Repository ${fullRepoName} created successfully`)
            } else if (checkResponse.ok) {
                console.log(`Repository ${fullRepoName} already exists`)
            } else {
                throw new Error('Failed to check repository status')
            }
        } catch (githubError: any) {
            console.error('GitHub repo check/creation failed:', githubError)
            return NextResponse.json({
                error: 'Failed to create GitHub repository',
                details: githubError.message
            }, { status: 500 })
        }

        // Create project record
        const { data: project, error: projectError } = await getSupabase()
            .from('projects')
            .insert({
                user_id: userId,
                project_name: projectName,
                project_description: projectDescription,
                tech_stack: techStack,
                repo_name: finalRepoName,
                days_duration: 15,
                current_day: 0,
                status: 'in_progress'
            })
            .select()
            .single()

        if (projectError) {
            console.error('Project creation error:', projectError)
            return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
        }

        // Update user_settings with active project
        await getSupabase()
            .from('user_settings')
            .update({ active_project_id: project.id })
            .eq('id', userId)

        return NextResponse.json({
            success: true,
            project: project,
            message: `Project "${projectName}" started! It will be built over 15 days.`
        })

    } catch (error: any) {
        console.error('Start project error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }

        // Get user's active project
        const { data: project, error } = await getSupabase()
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'in_progress')
            .single()

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            project: project || null,
            hasActiveProject: !!project
        })

    } catch (error: any) {
        console.error('Get project error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
