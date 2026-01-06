import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(req: Request) {
    try {
        const { userId, projectName, repoName, projectDescription, techStack } = await req.json()

        // Verify user has Enterprise plan
        const { data: user, error: userError } = await supabase
            .from('user_settings')
            .select('plan_type, github_username, github_access_token')
            .eq('id', userId)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (user.plan_type !== 'enterprise') {
            return NextResponse.json({ error: 'Enterprise plan required' }, { status: 403 })
        }

        // Check if user already has an active project
        const { data: activeProject } = await supabase
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

        // Create project record
        const { data: project, error: projectError } = await supabase
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
        await supabase
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
        const { data: project, error } = await supabase
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
