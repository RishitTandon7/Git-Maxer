import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    return handleSignout(request)
}

export async function POST(request: Request) {
    return handleSignout(request)
}

async function handleSignout(request: Request) {
    const cookieStore = await cookies()

    // Clear all Supabase auth cookies
    const allCookies = cookieStore.getAll()

    const response = NextResponse.json({ success: true })

    // Delete all supabase cookies
    allCookies.forEach(cookie => {
        if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
            response.cookies.delete(cookie.name)
        }
    })

    // Also explicitly clear common auth cookie patterns
    response.cookies.set('sb-jbquiugvtdphqbgmudim-auth-token', '', {
        expires: new Date(0),
        path: '/'
    })
    response.cookies.set('sb-jbquiugvtdphqbgmudim-auth-token-code-verifier', '', {
        expires: new Date(0),
        path: '/'
    })

    return response
}
