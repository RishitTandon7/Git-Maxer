import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                        }
                    },
                },
            }
        )

        const { path, user_agent, country } = await request.json()

        const { data: { session } } = await supabase.auth.getSession()
        const user_id = session?.user?.id || null

        const { error } = await supabase
            .from('analytics')
            .insert({
                user_id,
                path,
                user_agent,
                country: country || 'Unknown'
            })

        if (error) {
            console.error('Analytics Error:', error)
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
