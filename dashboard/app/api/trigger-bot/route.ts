import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Trigger the actual cron logic by calling the cron endpoint
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/cron`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        const data = await response.text()

        return NextResponse.json({
            message: 'Manual trigger executed',
            status: response.status,
            cronResponse: data,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to trigger cron',
            details: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
