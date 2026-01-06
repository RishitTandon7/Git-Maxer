'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Activity, Power, Save, History, User, Code, Clock, Languages, Check, X, AlertCircle, ChevronDown, Github, Globe, Home } from 'lucide-react'
import Link from 'next/link'
import { OwnerStats } from './OwnerStats'
import { useAuth } from '../providers/AuthProvider'

// Force dynamic rendering to avoid prerendering issues with Supabase
export const dynamic = 'force-dynamic'

export default function Dashboard() {
    const router = useRouter()
    const { signOut } = useAuth()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [userPlan, setUserPlan] = useState<string>('free') // Track user's plan

    const [config, setConfig] = useState({
        min_contributions: 1,
        pause_bot: false,
        github_username: '',
        repo_name: '',
        repo_visibility: 'public',
        preferred_language: 'any',
        commit_time: null as string | null
    })

    const [originalConfig, setOriginalConfig] = useState(config)
    const [logs, setLogs] = useState<any[]>([])

    // Initial data fetch - runs once on mount
    useEffect(() => {
        let mounted = true
        let timeoutId: NodeJS.Timeout

        const init = async () => {
            try {
                // Fail-safe: Force loading off after 5 seconds max
                timeoutId = setTimeout(() => {
                    if (mounted) {
                        console.warn('⚠️ Loading timeout - forcing off')
                        setLoading(false)
                    }
                }, 5000)

                await checkUser()
            } catch (error) {
                console.error('Init error:', error)
                if (mounted) setLoading(false)
            }
        }

        init()

        // Track View
        fetch('/api/analytics/track', {
            method: 'POST',
            body: JSON.stringify({
                path: '/dashboard',
                user_agent: navigator.userAgent,
                country: Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0]
            })
        }).catch(() => { })

        return () => {
            mounted = false
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [])

    // Keyboard shortcut - updates when hasUnsavedChanges changes
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                if (hasUnsavedChanges) handleSave()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [hasUnsavedChanges])

    useEffect(() => {
        const hasChanges = JSON.stringify(config) !== JSON.stringify(originalConfig)
        setHasUnsavedChanges(hasChanges)
    }, [config, originalConfig])

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3000)
    }

    const checkUser = async () => {
        console.log('🔍 checkUser: Starting...')

        // 1. Critical Check: Enviroment Variables
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!sbUrl || sbUrl.includes('placeholder')) {
            console.error('❌ CRITICAL: Supabase URL is missing or placeholder')
            showToast('error', 'SETUP ERROR: Supabase URL is missing! Check your environment variables.')
            setLoading(false)
            return
        }

        try {
            console.log('🔍 checkUser: Calling supabase.auth.getUser()')

            // Add a race condition to fail fast if Supabase is unreachable
            const timeOutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Supabase Connection Timeout')), 5000)
            )

            const { data: { user }, error } = await Promise.race([
                supabase.auth.getUser(),
                timeOutPromise
            ]) as any

            console.log('🔍 checkUser: Got response:', { user, error })

            if (error || !user) {
                console.error('Auth error:', error)
                setLoading(false)
                router.push('/')
                return
            }
            console.log('🔍 checkUser: Setting user and calling fetchData')
            setUser(user)
            await fetchData(user.id)
            console.log('🔍 checkUser: fetchData completed')
        } catch (error) {
            console.error('Error in checkUser:', error)
            setLoading(false)
            router.push('/')
        }
    }

    const fetchData = async (userId: string) => {
        try {
            const { data: settings, error: settingsError } = await supabase
                .from('user_settings')
                .select('*')
                .eq('id', userId)
                .single()

            console.log('Settings query result:', { settings, settingsError, userId })

            // ONLY redirect to setup if user is brand new (no database record)
            if (settingsError?.code === 'PGRST116') {
                console.log('New user detected (PGRST116), redirecting to setup')
                setLoading(false)
                router.push('/setup')
                return
            }

            // For ANY other error, throw it so we can see what's wrong
            if (settingsError) {
                console.error('Database error (NOT a new user):', settingsError)
                throw new Error(`Database query failed: ${settingsError.message || JSON.stringify(settingsError)}`)
            }

            // Check if settings are incomplete (shouldn't happen for existing users)
            if (!settings || !settings.github_username) {
                console.warn('User has record but incomplete settings:', settings)
                setLoading(false)
                router.push('/setup')
                return
            }

            // User has valid settings - load them
            const configData = {
                min_contributions: settings.min_contributions,
                pause_bot: settings.pause_bot,
                github_username: settings.github_username,
                repo_name: settings.repo_name,
                repo_visibility: settings.repo_visibility,
                preferred_language: settings.preferred_language || 'any',
                commit_time: settings.commit_time
            }
            setConfig(configData)
            setOriginalConfig(configData)
            setUserPlan(settings.plan_type || 'free')

            // Sync with localStorage to keep AuthProvider in sync on next load
            if (settings.plan_type) {
                localStorage.setItem('userPlan', settings.plan_type)
            }

            // Check subscription expiry for paid plans
            if (settings.plan_type === 'pro' || settings.plan_type === 'enterprise') {
                const expiryDate = settings.plan_expiry ? new Date(settings.plan_expiry) : null
                const now = new Date()

                if (expiryDate) {
                    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                    // Subscription expired - downgrade to free
                    if (daysUntilExpiry <= 0) {
                        console.warn(`Subscription expired (Days left: ${daysUntilExpiry}), downgrading to free`)

                        // Update in database
                        await supabase
                            .from('user_settings')
                            .update({
                                plan_type: 'free',
                                is_paid: false
                            })
                            .eq('id', userId)

                        setUserPlan('free')
                        localStorage.setItem('userPlan', 'free')

                        showToast('error', `Your ${settings.plan_type} subscription has expired. You've been downgraded to the free plan. Renew on the Pricing page!`)
                    }
                    // Warning: 3 days or less until expiry
                    else if (daysUntilExpiry <= 3) {
                        showToast('error', `⚠️ Your ${settings.plan_type} plan expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}! Renew soon to keep your benefits.`)
                    }
                }
            }

            // Load history
            const { data: history } = await supabase
                .from('generated_history')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10)

            if (history) setLogs(history)
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error)
            console.error('Error message:', error?.message)
            console.error('Error details:', error)
            showToast('error', `Failed to load dashboard: ${error?.message || 'Unknown error'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!hasUnsavedChanges) {
            showToast('success', 'No changes to save')
            return
        }

        setSaving(true)
        const { error } = await supabase
            .from('user_settings')
            .update({
                pause_bot: config.pause_bot,
                preferred_language: config.preferred_language,
                commit_time: config.commit_time,
                repo_name: config.repo_name,
                repo_visibility: config.repo_visibility
            })
            .eq('id', user.id)

        if (error) {
            showToast('error', 'Failed to save settings')
        } else {
            setOriginalConfig(config)
            showToast('success', 'Settings saved successfully!')
        }
        setSaving(false)
    }

    const toggleBot = () => {
        setConfig(prev => ({ ...prev, pause_bot: !prev.pause_bot }))
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

    if (loading) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58a6ff] mx-auto mb-4"></div>
                <p className="text-[#8b949e]">Loading dashboard...</p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0d1117] text-white relative overflow-hidden">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-lg shadow-2xl border"
                        style={{
                            backgroundColor: toast.type === 'success' ? '#238636' : '#da3633',
                            borderColor: toast.type === 'success' ? '#2ea043' : '#f85149',
                        }}
                    >
                        {toast.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <ThemeBackground plan={userPlan} />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 md:p-8 pt-24 pb-32">
                {/* Owner Analytics (Exclusive) */}
                {(userPlan === 'owner' || user?.user_metadata?.user_name === 'rishittandon7') && <OwnerStats />}

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-[#21262d]">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#c9d1d9] flex items-center gap-3">
                            <Code className={`w-7 h-7 sm:w-8 sm:h-8 ${userPlan === 'enterprise' ? 'text-[#EAB308]' : userPlan === 'pro' ? 'text-[#3B82F6]' : 'text-[#58a6ff]'}`} />
                            GitMaxer
                        </h1>
                        <p className="text-sm sm:text-base text-[#8b949e] mt-2">
                            Welcome back, <span className={`font-semibold ${userPlan === 'enterprise' ? 'text-[#EAB308]' : userPlan === 'pro' ? 'text-[#3B82F6]' : 'text-[#58a6ff]'}`}>@{user?.user_metadata?.user_name || config.github_username || 'User'}</span>
                            {userPlan !== 'free' && userPlan !== 'owner' && (
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${userPlan === 'enterprise' ? 'bg-[#EAB308]/20 text-[#EAB308] border border-[#EAB308]/30' : 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30'}`}>
                                    {userPlan === 'enterprise' ? '💼 ENTERPRISE' : '⭐ PRO'}
                                </span>
                            )}
                            {userPlan === 'owner' && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">👑 OWNER</span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {hasUnsavedChanges && (
                            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-xs text-[#f85149] flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span className="hidden sm:inline">Unsaved changes</span>
                            </motion.span>
                        )}
                        <Link href="/" className="px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium bg-[#21262d] text-[#c9d1d9] border border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e] transition-all flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" />
                            <span className="hidden sm:inline">Home</span>
                        </Link>
                        <button onClick={async () => {
                            try {
                                await signOut()
                            } catch (e) {
                                console.error("Sign out failed", e)
                            }
                            router.push('/')
                        }} className="px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium bg-[#21262d] text-[#c9d1d9] border border-[#30363d] hover:bg-[#30363d] hover:border-[#8b949e] transition-all w-full sm:w-auto">
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} onClick={toggleBot} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 hover:border-[#58a6ff] transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[#8b949e] font-medium">Bot Status</span>
                            <Activity className="w-5 h-5 text-[#58a6ff]" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            {config.pause_bot ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-[#f85149] animate-pulse"></span>
                                    <span className="text-[#f85149]">Paused</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
                                    <span className="text-[#3fb950]">Active</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-[#8b949e] mt-2">Click to toggle</p>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 hover:border-[#a371f7] transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[#8b949e] font-medium">Contributions</span>
                            <History className="w-5 h-5 text-[#a371f7]" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#c9d1d9]">{logs.length} Total</div>
                    </motion.div>

                    <motion.div whileHover={{ y: -4 }} className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 hover:border-[#3fb950] transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-[#8b949e] font-medium">Daily Minimum</span>
                            <Code className="w-5 h-5 text-[#3fb950]" />
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-[#c9d1d9]">{config.min_contributions}/day</div>
                    </motion.div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Settings */}
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#21262d]">
                                <Settings className="w-5 h-5 text-[#58a6ff]" />
                                <h2 className="text-lg font-semibold text-[#c9d1d9]">Bot Configuration</h2>
                            </div>

                            <div className="space-y-5">
                                {/* Language */}
                                <div>
                                    <label className="text-sm text-[#8b949e] font-medium mb-2 flex items-center gap-2">
                                        <Languages className="w-4 h-4" />
                                        Preferred Language
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={config.preferred_language}
                                            onChange={(e) => setConfig(prev => ({ ...prev, preferred_language: e.target.value }))}
                                            className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-lg p-3.5 text-[#c9d1d9] font-medium focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/30 transition-all appearance-none cursor-pointer hover:border-[#484f58]"
                                        >
                                            {languages.map(lang => (
                                                <option key={lang.value} value={lang.value} className="bg-[#161b22] py-2">{lang.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b949e] pointer-events-none" />
                                    </div>
                                </div>

                                {/* Time */}
                                <div>
                                    <label className="text-sm text-[#8b949e] font-medium mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Commit Time (IST)
                                    </label>
                                    <input
                                        type="time"
                                        value={config.commit_time || ''}
                                        onChange={(e) => setConfig(prev => ({ ...prev, commit_time: e.target.value || null }))}
                                        className="w-full bg-[#0d1117] border-2 border-[#30363d] rounded-lg p-3.5 text-[#c9d1d9] font-medium focus:outline-none focus:border-[#58a6ff] focus:ring-2 focus:ring-[#58a6ff]/30 transition-all hover:border-[#484f58] cursor-pointer"
                                        placeholder="--:--"
                                    />
                                    <p className="text-xs text-[#8b949e] mt-1.5">Leave empty for random time each day</p>
                                </div>

                                {/* Daily Commits Slider */}
                                <div>
                                    <label className="text-sm text-[#8b949e] font-medium mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Code className="w-4 h-4" />
                                            Daily Commits
                                        </div>
                                        <span className="text-[#c9d1d9] font-bold bg-[#21262d] px-2 py-0.5 rounded text-xs">
                                            {config.min_contributions} / day
                                        </span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max={user?.user_metadata?.user_name === 'rishittandon7' ? "50" : "10"}
                                        value={config.min_contributions}
                                        onChange={(e) => setConfig(prev => ({ ...prev, min_contributions: parseInt(e.target.value) }))}
                                        className="w-full h-2 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-[#2ea043]"
                                    />
                                    <div className="flex justify-between text-[10px] text-[#8b949e] mt-2 font-mono">
                                        <span>1</span>
                                        <span>{user?.user_metadata?.user_name === 'rishittandon7' ? "50" : "10"}</span>
                                    </div>
                                </div>

                                {/* Save */}
                                <motion.button
                                    onClick={handleSave}
                                    disabled={saving || !hasUnsavedChanges}
                                    whileHover={hasUnsavedChanges ? { scale: 1.02 } : {}}
                                    whileTap={hasUnsavedChanges ? { scale: 0.98 } : {}}
                                    className={`w-full font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 border shadow-lg ${hasUnsavedChanges
                                        ? 'bg-[#238636] text-white border-[#2ea043] shadow-[#238636]/20 hover:bg-[#2ea043] active:bg-[#2c974b]'
                                        : 'bg-[#21262d] text-[#8b949e] border-[#30363d] cursor-not-allowed'
                                        }`}
                                >
                                    <Save className="w-5 h-5" />
                                    {saving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes (Ctrl+S)' : 'No Changes'}
                                </motion.button>
                            </div>
                        </div>

                        {/* Account */}
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 sm:p-6">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#21262d]">
                                <User className="w-5 h-5 text-[#58a6ff]" />
                                <h2 className="text-lg font-semibold text-[#c9d1d9]">Account Info</h2>
                            </div>
                            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-[#8b949e]" />
                                    <div>
                                        <p className="text-xs text-[#8b949e]">GitHub Username</p>
                                        <p className="text-[#c9d1d9] font-mono font-semibold">@{config.github_username}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-[#8b949e] bg-[#21262d] px-3 py-1 rounded-full">Read-only</span>
                            </div>

                            <div className="flex items-center justify-between bg-[#0d1117] border border-[#30363d] rounded-lg p-4 mt-3">
                                <div className="flex items-center gap-3 flex-1">
                                    <Github className="w-5 h-5 text-[#8b949e]" />
                                    <div className="flex-1">
                                        <p className="text-xs text-[#8b949e] mb-1">Target Repository</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#8b949e] font-mono text-sm">@{config.github_username}/</span>
                                            <input
                                                type="text"
                                                value={config.repo_name || ''}
                                                onChange={(e) => setConfig(prev => ({ ...prev, repo_name: e.target.value }))}
                                                className="bg-[#0d1117] text-[#58a6ff] font-mono font-semibold focus:outline-none focus:border-b border-[#30363d] w-full max-w-[200px]"
                                                placeholder="repo-name"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <a
                                        href={`https://github.com/${config.github_username}/${config.repo_name || 'auto-contributions'}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-[#8b949e] hover:text-[#58a6ff] flex items-center gap-1"
                                    >
                                        View <Globe className="w-3 h-3" />
                                    </a>
                                    <select
                                        value={config.repo_visibility}
                                        onChange={(e) => setConfig(prev => ({ ...prev, repo_visibility: e.target.value }))}
                                        className="text-xs bg-[#21262d] text-[#c9d1d9] px-2 py-1 rounded-md border-none focus:ring-0 cursor-pointer"
                                    >
                                        <option value="public">Public</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5 sm:p-6 lg:sticky lg:top-6">
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#21262d]">
                                <History className="w-5 h-5 text-[#58a6ff]" />
                                <h2 className="text-lg font-semibold text-[#c9d1d9]">Recent Activity</h2>
                            </div>

                            <div className="space-y-3 max-h-[500px] lg:max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {logs.map((log, index) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-[#0d1117] border border-[#30363d] p-3 rounded-lg hover:border-[#58a6ff] transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="font-mono text-xs text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-1 rounded">
                                                {log.language || 'Code'}
                                            </span>
                                            <span className="text-xs text-[#8b949e]">
                                                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#8b949e] line-clamp-2 group-hover:text-[#c9d1d9] transition-colors">
                                            {log.content_snippet}
                                        </p>
                                    </motion.div>
                                ))}
                                {logs.length === 0 && (
                                    <div className="text-center py-12 text-[#8b949e]">
                                        <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No activity yet</p>
                                        <p className="text-xs mt-1">The bot will start soon!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <nav className="lg:hidden fixed top-0 w-full z-40 bg-[#0d1117] border-b border-[#30363d] px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 relative rounded-lg overflow-hidden">
                        <img src="/logo.jpg" alt="GitMaxer Logo" className="object-cover w-full h-full" />
                    </div>
                    <span className="font-bold text-lg text-[#c9d1d9]">GitMaxer</span>
                </div>
                <button onClick={toggleBot} className="p-2 rounded-lg bg-[#21262d] text-[#c9d1d9]">
                    <Activity size={20} className={config.pause_bot ? "text-[#f85149]" : "text-[#3fb950]"} />
                </button>
            </nav>
        </div>
    )
}


function ThemeBackground({ plan }: { plan: string }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    if (plan === 'owner') return <RoyalTheme />
    if (plan === 'pro') return <CyberTheme />
    if (plan === 'enterprise') return <GoldenTheme />

    // Default Green/Dark Theme
    return (
        <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-sm"
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
                        opacity: 0,
                        scale: Math.random() * 0.5 + 0.5
                    }}
                    animate={{
                        y: [null, Math.random() * -200],
                        opacity: [0, Math.random() * 0.5 + 0.2, 0],
                    }}
                    transition={{
                        duration: Math.random() * 10 + 10,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    style={{
                        width: '4px',
                        height: '4px',
                        backgroundColor: '#238636'
                    }}
                />
            ))}
        </div>
    )
}

function RoyalTheme() {
    return (
        <div className="absolute inset-0 bg-[#050505] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-[#050505] to-[#050505]" />
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-red-500 rounded-full blur-[1px]"
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                        y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
                        opacity: 0,
                    }}
                    animate={{
                        y: -100,
                        opacity: [0, 0.6, 0],
                    }}
                    transition={{
                        duration: Math.random() * 5 + 5,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "linear",
                    }}
                    style={{
                        width: Math.random() * 4 + 2 + 'px',
                        height: Math.random() * 4 + 2 + 'px',
                        boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
                    }}
                />
            ))}
        </div>
    )
}

function CyberTheme() {
    return (
        <div className="absolute inset-0 bg-[#000510] overflow-hidden font-mono">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-[#000510] to-[#000510]" />

            {/* Animated Moving Grid Floor */}
            <motion.div
                className="absolute inset-x-0 bottom-0 h-[60vh] bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:linear-gradient(to_bottom,transparent_10%,black_100%)] opacity-20"
                style={{ transform: 'perspective(500px) rotateX(60deg)' }}
                animate={{ backgroundPosition: ['0px 0px', '0px 50px'] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />

            {/* Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMik1Ii8+Cjwvc3ZnPg==')] opacity-30 z-0" />

            {/* Binary Rain Code */}
            {[...Array(25)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute text-cyan-500/30 text-[10px] whitespace-pre flex flex-col items-center leading-none select-none"
                    initial={{ y: -500, opacity: 0 }}
                    animate={{ y: 1500, opacity: [0, 1, 0] }}
                    transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
                    style={{ left: `${Math.random() * 100}%` }}
                >
                    {'010110'.split('').map((char, j) => <span key={j} style={{ opacity: Math.random() }}>{char}</span>)}
                </motion.div>
            ))}

            {/* Floating Hexagons */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={`hex-${i}`}
                    className="absolute border border-cyan-500/20 bg-cyan-500/5"
                    initial={{ opacity: 0, rotate: 0 }}
                    animate={{ opacity: [0, 0.3, 0], rotate: 360, y: [0, -50] }}
                    transition={{ duration: 15, repeat: Infinity, delay: Math.random() * 5 }}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: '60px',
                        height: '60px',
                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                    }}
                />
            ))}
        </div>
    )
}

function GoldenTheme() {
    return (
        <div className="absolute inset-0 bg-[#050505] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600/20 via-[#050505] to-[#050505]" />
            {[...Array(40)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute bg-yellow-400 rounded-full blur-[1px]"
                    initial={{
                        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                        y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 100,
                        opacity: 0,
                    }}
                    animate={{
                        y: -100,
                        opacity: [0, 0.8, 0],
                    }}
                    transition={{
                        duration: Math.random() * 4 + 4,
                        repeat: Infinity,
                        delay: Math.random() * 5,
                        ease: "linear",
                    }}
                    style={{
                        width: Math.random() * 6 + 3 + 'px',
                        height: Math.random() * 6 + 3 + 'px',
                        boxShadow: '0 0 15px rgba(234, 179, 8, 0.8)'
                    }}
                />
            ))}
        </div>
    )
}

