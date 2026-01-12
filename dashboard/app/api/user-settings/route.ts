import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client for server-side operations
function getServiceClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase configuration')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    console.log('📊 API: Fetching settings for', userId)
    const startTime = Date.now()

    try {
        const supabase = getServiceClient()

        const { data: settings, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .single()

        console.log(`📊 API: Query took ${Date.now() - startTime}ms`)

        if (error) {
            console.error('API Error:', error)
            return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
        }

        return NextResponse.json({ settings, queryTime: Date.now() - startTime })
    } catch (error: any) {
        console.error('API Exception:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
