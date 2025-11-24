'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Settings, Activity, Power, Save, History } from 'lucide-react'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [config, setConfig] = useState({
        min_contributions: 1,
        pause_bot: false,
        github_username: ''
    })

    const [logs, setLogs] = useState<any[]>([])

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
            return
        }
        setUser(user)
        fetchData(user.id)
    }

    const fetchData = async (userId: string) => {
        // Fetch Settings
        const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', userId)
            .single()

        if (settings) {
            setConfig({
                min_contributions: settings.min_contributions,
                pause_bot: settings.pause_bot,
                github_username: settings.github_username
            })
        }

        // Fetch History
        const { data: history } = await supabase
            .from('generated_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        if (history) setLogs(history)
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('user_settings')
            .update({
                min_contributions: config.min_contributions,
                pause_bot: config.pause_bot
            })
            .eq('id', user.id)

        if (error) alert('Error saving settings')
        setSaving(false)
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-gray-400">Welcome back, {config.github_username}</p>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-blue-400">
                            <Activity className="w-5 h-5" />
                            <span className="font-semibold">Status</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {config.pause_bot ? <span className="text-red-500">Paused</span> : <span className="text-green-500">Active</span>}
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                            <History className="w-5 h-5" />
                            <span className="font-semibold">Total Generated</span>
                        </div>
                        <div className="text-2xl font-bold">{logs.length}</div>
                    </div>
                </div>

                {/* Settings Area */}
                <div className="glass-panel p-8 rounded-2xl space-y-6">
                    <div className="flex items-center gap-3 text-xl font-semibold border-b border-gray-800 pb-4">
                        <Settings className="w-6 h-6" />
                        Bot Configuration
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Min Contributions / Day</label>
                            <input
                                type="number"
                                value={config.min_contributions}
                                onChange={(e) => setConfig({ ...config, min_contributions: parseInt(e.target.value) })}
                                className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Bot Status</label>
                            <button
                                onClick={() => setConfig({ ...config, pause_bot: !config.pause_bot })}
                                className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${config.pause_bot
                                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                        : 'bg-green-500/10 text-green-500 border border-green-500/20'
                                    }`}
                            >
                                <Power className="w-4 h-4" />
                                {config.pause_bot ? 'Bot is Paused' : 'Bot is Active'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Recent Activity</h2>
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="glass-panel p-4 rounded-xl flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-mono text-sm text-blue-400">{log.language || 'Code'}</div>
                                    <div className="text-gray-400 text-xs truncate max-w-md">{log.content_snippet}...</div>
                                </div>
                                <div className="text-xs text-gray-600">
                                    {new Date(log.created_at).toLocaleDateString()}
                                </div>
                            </motion.div>
                        ))}
                        {logs.length === 0 && (
                            <div className="text-gray-500 text-center py-8">No code generated yet.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
