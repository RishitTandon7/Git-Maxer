'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Activity, TrendingUp, AlertTriangle, Shield, Terminal, Database, Globe, Search, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Reuse the verify logic or just protect heavily
// In real app, middleware protection is needed.

export default function AdminPage() {
    const [stats, setStats] = useState<any>(null)

    useEffect(() => {
        // Fetch real stats
        fetch('/api/admin/stats').then(res => res.json()).then(setStats)
        const interval = setInterval(() => {
            fetch('/api/admin/stats').then(res => res.json()).then(setStats)
        }, 5000)
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

                        {/* Recent User Table */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-200 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-500" />
                                    Recent Registrations (Real-Time)
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="border-b border-white/5 text-xs uppercase font-mono bg-white/5">
                                        <tr>
                                            <th className="p-3">User</th>
                                            <th className="p-3">Plan</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {stats?.recentUsers?.length > 0 ? (
                                            stats.recentUsers.map((user: any, i: number) => (
                                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-3 font-medium text-white flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-[10px] uppercase">
                                                            {user.github_username?.[0] || 'U'}
                                                        </div>
                                                        {user.github_username || 'Anonymous'}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs border uppercase ${user.plan_type === 'owner' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            user.plan_type === 'enterprise' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                user.plan_type === 'pro' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                                    'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                            }`}>
                                                            {user.plan_type || 'Free'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3"><span className="text-green-500 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active</span></td>
                                                    <td className="p-3 font-mono text-xs text-gray-600">
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="p-4 text-center text-gray-600 italic">No users found in database yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                                <ActionButton label="Maintenance Mode" color="red" />
                                <ActionButton label="Grant Credits" color="green" />
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
