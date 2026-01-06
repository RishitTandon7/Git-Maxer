import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const envCheck = {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        VERCEL_URL: !!process.env.VERCEL_URL,
    }

    const allPresent = Object.values(envCheck).every(v => v === true)

    return NextResponse.json({
        message: 'Environment Variables Check',
        variables: envCheck,
        status: allPresent ? '✅ All required variables present' : '❌ Missing variables',
        missingVars: Object.keys(envCheck).filter(k => !envCheck[k as keyof typeof envCheck])
    })
}
