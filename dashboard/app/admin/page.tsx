'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Activity, TrendingUp, AlertTriangle, Shield, Terminal, Database, Globe, Search, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

// Reuse the verify logic or just protect heavily
// In real app, middleware protection is needed.

export default function AdminPage() {
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        // Fetch real stats
        const fetchData = async () => {
            try {
                const res = await fetch('/api/admin/stats')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                setStats(data)
            } catch (e) {
                console.error("Admin stats error:", e)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-red-500/30 overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-[#050505] to-[#050505]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            <main className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                                <Shield className="w-8 h-8 text-red-500" />
                                GOD MODE
                            </h1>
                            <p className="text-xs text-red-500/60 font-mono tracking-widest uppercase">System Administrator Access</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-gray-400 hover:text-white hover:border-white/30 transition-all"
                        >
                            Force Refresh
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-500/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-mono text-red-400">LIVE CONNECTION</span>
                        </div>
                    </div>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <KpiCard
                        title="REAL LIVE USERS"
                        value={stats?.liveUsers || 0}
                        icon={Users}
                        color="red"
                        trend="+12%"
                    />
                    <KpiCard
                        title="LIFETIME REVENUE"
                        value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
                        icon={DollarSign}
                        color="orange"
                        trend="Steady"
                    />
                    <KpiCard
                        title="TOTAL GENERATIONS"
                        value={stats?.totalViews?.toLocaleString() || 0}
                        icon={Activity}
                        color="purple"
                        trend="+840 today"
                    />
                    <KpiCard
                        title="DATABASE SIZE"
                        value={stats?.totalUsers || 0}
                        icon={Database}
                        color="blue"
                        trend="+5 users"
                    />
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Col: Server & map */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Today's Activity Stats (Replaces Map) */}
                        <div className="grid grid-cols-2 gap-6 h-96">
                            {/* Commits Generated Today */}
                            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                                <h3 className="font-bold text-gray-200 flex items-center gap-2 relative z-10">
                                    <Terminal className="w-5 h-5 text-green-500" />
                                    Commits Generated
                                </h3>
                                <p className="text-xs text-gray-500 mb-8 relative z-10">Since midnight today</p>
                                <div className="text-6xl font-black text-white tracking-tighter relative z-10">
                                    {stats?.commitsToday || 0}
                                </div>
                                <div className="absolute bottom-0 right-0 p-4 opacity-10 grayscale group-hover:grayscale-0 transition-all">
                                    <Activity className="w-32 h-32 text-green-500" />
                                </div>
                            </div>

                            {/* Opened Today */}
                            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                                <h3 className="font-bold text-gray-200 flex items-center gap-2 relative z-10">
                                    <Eye className="w-5 h-5 text-blue-500" />
                                    Dashboard Visits
                                </h3>
                                <p className="text-xs text-gray-500 mb-8 relative z-10">Unique sessions today</p>
                                <div className="text-6xl font-black text-white tracking-tighter relative z-10">
                                    {stats?.openedToday || 0}
                                </div>
                                <div className="absolute bottom-0 right-0 p-4 opacity-10 grayscale group-hover:grayscale-0 transition-all">
                                    <Users className="w-32 h-32 text-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* All Users Table */}
                        <AllUsersTable stats={stats} />
                    </div>

                    {/* Right Col: Controls & Terminal */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-orange-500" />
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                <BackfillButton />
                                <CronButton />
                                <ActionButton label="Clean Cache" color="blue" />
                                <ActionButton label="Emergency Kill" color="red" />
                            </div>
                        </div>

                        {/* Console Logs - Real Data */}
                        <div className="bg-black border border-white/10 rounded-2xl p-4 font-mono text-xs h-64 overflow-hidden relative">
                            <div className="absolute top-2 right-2 text-white/20 text-[10px]">LIVE_LOGS</div>
                            <div className="space-y-1 text-green-500/80 h-full overflow-y-auto custom-scrollbar">
                                <p className="opacity-50">{'> System initialized...'}</p>
                                <p className="opacity-50">{'> Connected to Supabase [Latency: 24ms]'}</p>

                                {stats?.recentLogs?.length > 0 ? (
                                    stats.recentLogs.map((log: any, i: number) => (
                                        <p key={i} className="break-all border-l-2 border-green-500/20 pl-2 my-1 hover:bg-white/5">
                                            <span className="text-gray-500">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                                            <span className="text-blue-400"> [{log.language}]</span>
                                            <span className="text-gray-300"> {log.content_snippet}</span>
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-600 italic pt-10">Waiting for bot activity...</p>
                                )}

                                <p className="animate-pulse mt-2">{'> _'}</p>
                            </div>
                        </div>

                        {/* System Health */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-gray-200 mb-4">System Resources</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">CPU Usage</span>
                                        <span className="text-red-400 font-mono">84%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 w-[84%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Memory (RAM)</span>
                                        <span className="text-blue-400 font-mono">42%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[42%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Storage</span>
                                        <span className="text-green-400 font-mono">12%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[12%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}

function KpiCard({ title, value, icon: Icon, color, trend }: any) {
    const colors = {
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    }
    const theme = colors[color as keyof typeof colors]

    return (
        <div className={`p-4 rounded-xl border ${theme.split(' ')[2]} bg-[#0d1117] flex flex-col relative overflow-hidden group hover:border-opacity-50 transition-colors`}>
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon className={`w-16 h-16 ${theme.split(' ')[0]}`} />
            </div>
            <div className="flex justify-between items-start mb-2 relative z-10">
                <h3 className="text-xs font-bold text-gray-400 tracking-wider">{title}</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${theme} font-mono`}>{trend}</span>
            </div>
            <div className="text-3xl font-bold text-white relative z-10">{value}</div>
        </div>
    )
}

function ActionButton({ label, color }: any) {
    const colors = {
        red: 'hover:bg-red-500/20 hover:border-red-500/50 text-red-400 border-red-500/20',
        blue: 'hover:bg-blue-500/20 hover:border-blue-500/50 text-blue-400 border-blue-500/20',
        green: 'hover:bg-green-500/20 hover:border-green-500/50 text-green-400 border-green-500/20',
        orange: 'hover:bg-orange-500/20 hover:border-orange-500/50 text-orange-400 border-orange-500/20',
    }
    const theme = colors[color as keyof typeof colors]

    return (
        <button className={`p-3 rounded-lg border bg-[#050505] text-xs font-bold transition-all active:scale-95 ${theme}`}>
            {label}
        </button>
    )
}

function BackfillButton() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)

    const runBackfill = async () => {
        if (!confirm('Run backfill for past 2 days? This will create commits for all Pro/LeetCode users.')) return
        setLoading(true)
        setResult(null)
        try {
            const res = await fetch('/api/backfill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ daysToBackfill: 2 })
            })
            const data = await res.json()
            setResult(`✅ ${data.message || 'Done!'}\n${data.results?.map((r: any) => `${r.user}: ${r.status} (${r.commitsCreated || 0} commits)`).join('\n') || ''}`)
            alert(`Backfill Complete!\n\n${data.message}`)
        } catch (e: any) {
            setResult(`❌ Error: ${e.message}`)
            alert(`Backfill failed: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={runBackfill}
            disabled={loading}
            className="p-3 rounded-lg border bg-[#050505] text-xs font-bold transition-all active:scale-95 hover:bg-orange-500/20 hover:border-orange-500/50 text-orange-400 border-orange-500/20 disabled:opacity-50"
        >
            {loading ? '⏳ Running...' : '🔄 Run Backfill (2 days)'}
        </button>
    )
}

function CronButton() {
    const [loading, setLoading] = useState(false)

    const runCron = async () => {
        if (!confirm('Run cron job now? This will process all pending contributions.')) return
        setLoading(true)
        try {
            const res = await fetch('/api/cron')
            const data = await res.json()
            alert(`Cron Complete!\n\n${data.output?.substring(0, 1000) || JSON.stringify(data)}`)
        } catch (e: any) {
            alert(`Cron failed: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={runCron}
            disabled={loading}
            className="p-3 rounded-lg border bg-[#050505] text-xs font-bold transition-all active:scale-95 hover:bg-green-500/20 hover:border-green-500/50 text-green-400 border-green-500/20 disabled:opacity-50"
        >
            {loading ? '⏳ Running...' : '▶️ Run Cron Now'}
        </button>
    )
}

function AllUsersTable({ stats }: { stats: any }) {
    const [filterPlan, setFilterPlan] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
    const [actionLoading, setActionLoading] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState('python')
    const [customRepo, setCustomRepo] = useState('')

    const languages = [
        { value: 'python', label: '🐍 Python', ext: 'py' },
        { value: 'javascript', label: '📜 JavaScript', ext: 'js' },
        { value: 'typescript', label: '💙 TypeScript', ext: 'ts' },
        { value: 'java', label: '☕ Java', ext: 'java' },
        { value: 'cpp', label: '⚡ C++', ext: 'cpp' },
        { value: 'go', label: '🐹 Go', ext: 'go' },
        { value: 'rust', label: '🦀 Rust', ext: 'rs' },
        { value: 'csharp', label: '💜 C#', ext: 'cs' },
    ]

    // Use allUsers from the admin stats API (bypasses RLS)
    const allUsers = stats?.allUsers || []
    const loading = !stats

    // Filter users
    const filteredUsers = allUsers.filter((user: any) => {
        const matchesSearch = user.github_username?.toLowerCase().includes(searchQuery.toLowerCase())
        const plan = user.plan_type || 'free'
        const matchesPlan = filterPlan === 'all' ||
            (filterPlan === 'paid' && ['pro', 'leetcode', 'enterprise', 'owner'].includes(plan)) ||
            (filterPlan === 'unpaid' && plan === 'free') ||
            plan === filterPlan
        return matchesSearch && matchesPlan
    })

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const selectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(filteredUsers.map((u: any) => u.id))
        }
    }

    const runBulkContribute = async () => {
        if (selectedUsers.length === 0) return alert('Select at least one user')
        if (!confirm(`Contribute for ${selectedUsers.length} user(s) on ${targetDate}?`)) return

        setActionLoading(true)
        let success = 0, failed = 0

        for (const userId of selectedUsers) {
            const user = allUsers.find((u: any) => u.id === userId)
            if (!user) continue

            try {
                const res = await fetch('/api/admin/contribute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        username: user.github_username,
                        date: targetDate,
                        language: selectedLanguage,
                        customRepo: customRepo || undefined
                    })
                })
                const data = await res.json()
                if (data.success) success++
                else failed++
            } catch {
                failed++
            }
        }

        alert(`✅ Done!\nSuccess: ${success}\nFailed: ${failed}\n\nNote: Commits attributed to: ${allUsers.find((u: any) => u.id === selectedUsers[0])?.github_username || 'User'} (via noreply)`)
        setActionLoading(false)
        setSelectedUsers([])
    }

    // Plan counts
    const counts = {
        all: allUsers.length,
        paid: allUsers.filter(u => ['pro', 'leetcode', 'enterprise', 'owner'].includes(u.plan_type)).length,
        unpaid: allUsers.filter(u => !u.plan_type || u.plan_type === 'free').length,
        pro: allUsers.filter(u => u.plan_type === 'pro').length,
        leetcode: allUsers.filter(u => u.plan_type === 'leetcode').length,
        enterprise: allUsers.filter(u => u.plan_type === 'enterprise').length,
        owner: allUsers.filter(u => u.plan_type === 'owner').length,
    }

    const tabs = [
        { key: 'all', label: 'All' },
        { key: 'paid', label: '💰 Paid' },
        { key: 'unpaid', label: 'Free' },
        { key: 'pro', label: 'Pro' },
        { key: 'leetcode', label: 'LeetCode' },
        { key: 'enterprise', label: 'Enterprise' },
        { key: 'owner', label: 'Owner' },
    ]

    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-500" />
                    All Users ({filteredUsers.length})
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 bg-black/50 border border-white/20 rounded-lg text-sm text-white focus:border-green-500 outline-none"
                    />
                </div>
            </div>

            {/* Bulk Action Panel */}
            {selectedUsers.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4">
                    <span className="text-purple-400 font-bold text-sm">
                        {selectedUsers.length} user(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">Date:</span>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="px-3 py-1.5 bg-black/50 border border-white/20 rounded-lg text-sm text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">Language:</span>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="px-3 py-1.5 bg-black/50 border border-white/20 rounded-lg text-sm text-white"
                        >
                            {languages.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">Repo:</span>
                        <input
                            type="text"
                            value={customRepo}
                            onChange={(e) => setCustomRepo(e.target.value)}
                            placeholder="auto-contributions"
                            className="px-3 py-1.5 bg-black/50 border border-white/20 rounded-lg text-sm text-white w-40"
                        />
                    </div>
                    <button
                        onClick={runBulkContribute}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {actionLoading ? '⏳ Processing...' : `▶️ Contribute for ${selectedUsers.length} users`}
                    </button>
                    <button
                        onClick={() => setSelectedUsers([])}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-lg"
                    >
                        Clear
                    </button>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterPlan(tab.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filterPlan === tab.key
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                            }`}
                    >
                        {tab.label} ({counts[tab.key as keyof typeof counts]})
                    </button>
                ))}
            </div>

            {/* User Table */}
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="border-b border-white/5 text-xs uppercase font-mono bg-white/5 sticky top-0">
                        <tr>
                            <th className="p-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                    onChange={selectAll}
                                    className="w-4 h-4 accent-green-500 cursor-pointer"
                                />
                            </th>
                            <th className="p-3">User</th>
                            <th className="p-3">Auth</th>
                            <th className="p-3">Plan</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Last Commit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-600">Loading...</td></tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user: any, i: number) => (
                                <UserRow
                                    key={user.id || i}
                                    user={user}
                                    selected={selectedUsers.includes(user.id)}
                                    onToggle={() => toggleUser(user.id)}
                                />
                            ))
                        ) : (
                            <tr><td colSpan={5} className="p-4 text-center text-gray-600 italic">No users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function UserRow({ user, selected, onToggle }: { user: any; selected: boolean; onToggle: () => void }) {
    return (
        <tr className={`hover:bg-white/5 transition-colors ${selected ? 'bg-purple-500/10' : ''}`}>
            <td className="p-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onChange={onToggle}
                    className="w-4 h-4 accent-green-500 cursor-pointer"
                />
            </td>
            <td className="p-3 font-medium text-white">
                <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] uppercase ${user.plan_type === 'pro' ? 'bg-blue-500' :
                        user.plan_type === 'leetcode' ? 'bg-purple-500' :
                            user.plan_type === 'enterprise' ? 'bg-amber-500' :
                                user.plan_type === 'owner' ? 'bg-red-500' :
                                    'bg-gray-600'
                        }`}>
                        {user.github_username?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            {user.github_username || 'Unknown'}
                            {user.github_username && (
                                <a
                                    href={`https://github.com/${user.github_username}/${user.repo_name || 'auto-contributions'}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-500 hover:text-green-400 no-underline"
                                >
                                    ↗
                                </a>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-500">{user.email || 'No email'}</div>
                    </div>
                </div>
            </td>
            <td className="p-3">
                {user.provider === 'google' ? (
                    <span className="bg-red-500/10 text-red-400 text-[10px] border border-red-500/30 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        Google
                    </span>
                ) : (
                    <span className="bg-green-500/10 text-green-400 text-[10px] border border-green-500/30 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        GitHub
                    </span>
                )}
            </td>
            <td className="p-3 text-xs text-gray-400">
                <span className={`px-2 py-1 rounded border ${user.plan_type === 'pro' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    user.plan_type === 'enterprise' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        user.plan_type === 'leetcode' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                            user.plan_type === 'pro' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                    {user.plan_type || 'Free'}
                </span>
            </td>
            <td className="p-3">
                <span className={`flex items-center gap-1 ${user.pause_bot ? 'text-gray-500' : 'text-green-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.pause_bot ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`} />
                    {user.pause_bot ? 'Paused' : 'Active'}
                </span>
            </td>
            <td className="p-3 font-mono text-xs text-gray-600">
                {user.last_commit_ts ? new Date(user.last_commit_ts).toLocaleDateString() : 'Never'}
            </td>
        </tr>
    )
}
