import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST() {
    try {
        // Verify user is authenticated
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll() { },
                },
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log(`🧪 Manual bot test triggered by user: ${user.id}`)

        // Import and run the bot logic directly
        const { runBotForUser } = await import('../../../utils/bot-runner')
        const result = await runBotForUser(user.id)

        return NextResponse.json({
            success: true,
            message: 'Bot executed successfully',
            result,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        console.error('❌ Test bot error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST method to trigger bot test',
        hint: 'This endpoint requires authentication'
    })
}
