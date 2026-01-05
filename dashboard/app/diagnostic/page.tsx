'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DiagnosticPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkData = async () => {
            try {
                // Get current user
                const { data: { user }, error: userError } = await supabase.auth.getUser()

                if (!user) {
                    setData({ error: 'Not logged in', user: null })
                    setLoading(false)
                    return
                }

                // Try to get user settings
                const { data: settings, error: settingsError } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                setData({
                    user: {
                        id: user.id,
                        email: user.email,
                        metadata: user.user_metadata
                    },
                    settings,
                    settingsError: settingsError ? {
                        message: settingsError.message,
                        code: settingsError.code,
                        details: settingsError.details
                    } : null
                })
            } catch (error: any) {
                setData({ error: error.message })
            } finally {
                setLoading(false)
            }
        }

        checkData()
    }, [])

    if (loading) return <div className="min-h-screen bg-black text-white p-8">Loading...</div>

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-8">Database Diagnostic</h1>

            <div className="space-y-4">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-4 py-2 bg-blue-500 rounded"
                >
                    Back to Dashboard
                </button>

                <div className="bg-gray-900 p-4 rounded">
                    <h2 className="text-xl font-bold mb-2">Raw Data:</h2>
                    <pre className="text-xs overflow-auto max-h-96">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                </div>

                {data?.settingsError?.code === 'PGRST116' && (
                    <div className="bg-yellow-900/50 border border-yellow-500 p-4 rounded">
                        <h2 className="text-xl font-bold mb-2">⚠️ No Settings Record Found</h2>
                        <p>You need to complete setup. This is normal for new users.</p>
                        <button
                            onClick={() => router.push('/setup')}
                            className="mt-4 px-4 py-2 bg-yellow-500 text-black rounded"
                        >
                            Go to Setup
                        </button>
                    </div>
                )}

                {data?.settings && (
                    <div className="bg-green-900/50 border border-green-500 p-4 rounded">
                        <h2 className="text-xl font-bold mb-2">✅ Settings Found</h2>
                        <p>Username: {data.settings.github_username}</p>
                        <p>Plan: {data.settings.plan_type}</p>
                        <p>Repo: {data.settings.repo_name}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
