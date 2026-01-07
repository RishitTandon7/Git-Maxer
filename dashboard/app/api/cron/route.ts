import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max execution time

export async function GET(request: Request) {
    try {
        // Verify this is a legitimate cron request (Vercel adds this header)
        const authHeader = request.headers.get('authorization')

        // In production, Vercel sends a secret token
        // For now, we'll allow it if CRON_SECRET matches or if it's from Vercel
        const cronSecret = process.env.CRON_SECRET
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            // Check if it's from Vercel's cron system
            const userAgent = request.headers.get('user-agent') || ''
            if (!userAgent.includes('vercel-cron')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
        }

        console.log('🤖 Cron job triggered at:', new Date().toISOString())

        // Execute the Python cron script
        const scriptPath = path.join(process.cwd(), 'api', 'cron.py')

        // Run the Python script
        const { stdout, stderr } = await execAsync(`python "${scriptPath}"`, {
            cwd: process.cwd(),
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1'
            },
            timeout: 280000 // 4 minutes 40 seconds (leave buffer for response)
        })

        console.log('✅ Cron execution completed')
        console.log('STDOUT:', stdout)

        if (stderr) {
            console.warn('STDERR:', stderr)
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            output: stdout,
            errors: stderr || null
        })

    } catch (error: any) {
        console.error('❌ Cron execution failed:', error)

        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
