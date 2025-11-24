'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Settings, Activity, Power, Save, History, User, Code } from 'lucide-react'

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mounted, setMounted] = useState(false)

    const [config, setConfig] = useState({
        min_contributions: 1,
        pause_bot: false,
        github_username: '',
        preferred_language: 'any',
        commit_time: null as string | null
    })

    const [logs, setLogs] = useState<any[]>([])

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Call useTransform unconditionally (hooks must be in same order every render)
    const transformX = useTransform(mouseX, (x) => x - 300)
    const transformY = useTransform(mouseY, (y) => y - 300)

    useEffect(() => {
        setMounted(true)
        checkUser()

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX)
            mouseY.set(e.clientY)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
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
        const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (!settings || !settings.github_username) {
            router.push('/setup')
            return
        }

        if (settings) {
            setConfig({
                min_contributions: settings.min_contributions,
                pause_bot: settings.pause_bot,
                github_username: settings.github_username,
                preferred_language: settings.preferred_language || 'any',
                commit_time: settings.commit_time
            })
        }

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
                pause_bot: config.pause_bot,
                preferred_language: config.preferred_language,
                commit_time: config.commit_time
            })
            .eq('user_id', user.id)

        if (error) alert('Error saving settings')
        setSaving(false)
    }

    const languages = [
        { value: 'any', label: 'Any Language' },
        { value: 'python', label: 'Python' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
    ]

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
                {mounted && (
                    <motion.div
                        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
                        style={{
                            background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(147,51,234,0.3) 50%, transparent 70%)',
                            x: transformX,
                            y: transformY,
                        }}
                    />
                )}

                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Dashboard</h1>
                        <p className="text-gray-400 mt-1">Welcome back, {config.github_username}</p>
                    </div>
                    <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm text-gray-500 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                        Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-blue-400">
                            <Activity className="w-5 h-5" />
                            <span className="font-semibold">Status</span>
                        </div>
                        <div className="text-2xl font-bold">
                            {config.pause_bot ? <span className="text-red-500">Paused</span> : <span className="text-green-500">Active</span>}
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                            <History className="w-5 h-5" />
                            <span className="font-semibold">Generated</span>
                        </div>
                        <div className="text-2xl font-bold">{logs.length}</div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="glass-panel p-6 rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-green-400">
                            <Code className="w-5 h-5" />
                            <span className="font-semibold">Language</span>
                        </div>
                        <div className="text-lg font-bold capitalize">{config.preferred_language}</div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div whileHover={{ scale: 1.01 }} className="glass-panel p-8 rounded-2xl space-y-6">
                        <div className="flex items-center gap-3 text-xl font-semibold border-b border-gray-800 pb-4">
                            <User className="w-6 h-6" />
                            Account Settings
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">GitHub Username</label>
                            <div className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 text-gray-300">
                                {config.github_username}
                            </div>
                            <p className="text-xs text-gray-500">Username cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Preferred Language</label>
                            <select value={config.preferred_language} onChange={(e) => setConfig({ ...config, preferred_language: e.target.value })} className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors">
                                {languages.map(lang => (
                                    <option key={lang.value} value={lang.value} className="bg-black">{lang.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Commit Time</label>
                            <input type="time" value={config.commit_time || ''} onChange={(e) => setConfig({ ...config, commit_time: e.target.value || null })} className="w-full bg-black/50 border border-gray-800 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors" />
                            <p className="text-xs text-gray-500">Leave empty for random time</p>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.01 }} className="glass-panel p-8 rounded-2xl space-y-6">
                        <div className="flex items-center gap-3 text-xl font-semibold border-b border-gray-800 pb-4">
                            <Settings className="w-6 h-6" />
                            Bot Configuration
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">
                                Min Contributions / Day: <span className="text-blue-400 font-bold">{config.min_contributions}</span>
                            </label>
                            <input type="range" min="1" max="10" value={config.min_contributions} onChange={(e) => setConfig({ ...config, min_contributions: parseInt(e.target.value) })} className="w-full" />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Bot Status</label>
                            <button onClick={() => setConfig({ ...config, pause_bot: !config.pause_bot })} className={`w-full flex items-center justify-center gap-2 p-4 rounded-lg font-medium transition-all ${config.pause_bot ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                <Power className="w-5 h-5" />
                                {config.pause_bot ? 'Bot is Paused' : 'Bot is Active'}
                            </button>
                        </div>

                        <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <History className="w-6 h-6" />
                        Recent Activity
                    </h2>
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.01, x: 4 }} className="glass-panel p-4 rounded-xl flex justify-between items-center">
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
                            <div className="text-gray-500 text-center py-12 glass-panel rounded-xl">
                                No code generated yet. The bot will start working soon!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
