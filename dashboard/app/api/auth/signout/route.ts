import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // Clear any server-side session if needed
    const response = NextResponse.redirect(new URL('/', request.url))

    // Clear auth cookies
    response.cookies.set('sb-jbquiugvtdphqbgmudim-auth-token', '', {
        expires: new Date(0),
        path: '/'
    })

    return response
}
