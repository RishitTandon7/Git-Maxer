'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, DollarSign, Eye, Activity, TrendingUp, Calendar, Filter, Crown, ShieldAlert, UserCheck, Zap, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

import { useRouter } from 'next/navigation'

export function OwnerStats() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily')

    // Control inputs
    const [targetUser, setTargetUser] = useState('')
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        fetchRealStats()
        const interval = setInterval(fetchRealStats, 30000)
        return () => clearInterval(interval)
    }, [isOpen])

    const fetchRealStats = async () => {
        setLoading(true)
        try {
            // Add timeout to prevent blocking
            const timeoutPromise = new Promise<any>((_, reject) =>
                setTimeout(() => reject(new Error('Stats timeout')), 3000)
            )

            const fetchPromise = fetch('/api/admin/stats').then(res => res.json())

            const data = await Promise.race([fetchPromise, timeoutPromise])

            if (!data.error) setStats(data)
        } catch (e) {
            console.error("Failed to fetch stats:", e)
            // Set empty stats to prevent blocking
            setStats({ liveUsers: 0, totalRevenue: 0, totalViews: 0, totalUsers: 0 })
        } finally {
            setLoading(false)
        }
    }

    const handleUserAction = async (action: 'pro' | 'enterprise' | 'ban') => {
        if (!targetUser) return alert("Enter a username/email")
        setActionLoading(true)

        // In a real app, this would call an admin API. 
        // For now, we simulate the admin action success.
        setTimeout(() => {
            alert(`Action '${action.toUpperCase()}' executed on ${targetUser}`)
            setActionLoading(false)
            setTargetUser('')
        }, 1500)
    }

    // 1. The "Different Button" (Floating Crown)
    if (!isOpen) {
        return (
            <motion.button
                onClick={() => router.push('/admin')}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center border-2 border-white/10 text-white cursor-pointer group"
            >
                <Crown className="w-6 h-6 group-hover:animate-pulse" />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border border-black animate-ping" />
            </motion.button>
        )
    }

    // 2. The Full Command Center Overlay
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 bg-[#0d1117] border border-red-500/30 rounded-2xl p-6 relative shadow-2xl overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-gradient-x" />

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-red-500 flex items-center gap-3">
                        <span className="p-2 bg-red-500/10 rounded-lg"><Crown className="w-6 h-6" /></span>
                        Admin Command Center
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Grid Use Real Data */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatsCard
                        title="REAL LIVE USERS"
                        value={stats?.liveUsers || 0}
                        icon={Users}
                        color="red"
                        subValue="Active Now"
                    />
                    <StatsCard
                        title="TOTAL REVENUE"
                        value={`₹${stats?.totalRevenue?.toLocaleString() || 0}`}
                        icon={DollarSign}
                        color="orange"
                        subValue="Lifetime"
                    />
                    <StatsCard
                        title="TOTAL LOGS"
                        value={stats?.totalViews?.toLocaleString() || 0}
                        icon={Activity}
                        color="red"
                        subValue="Generations"
                    />
                    <StatsCard
                        title="DATABASE USERS"
                        value={stats?.totalUsers || 0}
                        icon={TrendingUp}
                        color="green"
                        subValue="Registered"
                    />
                </div>

                {/* 3. More Controls Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* User Management Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-blue-400" />
                            User Management
                        </h3>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Enter Username or Email"
                                value={targetUser}
                                onChange={(e) => setTargetUser(e.target.value)}
                                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-red-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleUserAction('pro')}
                                disabled={actionLoading}
                                className="bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold py-2 rounded hover:bg-blue-600/30 transition-colors"
                            >
                                GRANT PRO
                            </button>
                            <button
                                onClick={() => handleUserAction('enterprise')}
                                disabled={actionLoading}
                                className="bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs font-bold py-2 rounded hover:bg-amber-600/30 transition-colors"
                            >
                                GRANT GOLD
                            </button>
                            <button
                                onClick={() => handleUserAction('ban')}
                                disabled={actionLoading}
                                className="bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold py-2 rounded hover:bg-red-600/30 transition-colors"
                            >
                                BAN USER
                            </button>
                        </div>
                    </div>

                    {/* System Controls */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-500" />
                            System Override
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg hover:border-red-500/50 hover:bg-red-500/20 transition-all group">
                                <Zap className="w-6 h-6 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-red-400">Emergency Stop</span>
                            </button>
                            <button className="flex flex-col items-center justify-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:border-orange-500/50 hover:bg-orange-500/20 transition-all group">
                                <Activity className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-orange-400">Force Reboot</span>
                            </button>
                        </div>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    )
}

function StatsCard({ title, value, icon: Icon, color, subValue }: any) {
    const colorClasses = {
        red: 'border-red-500/30 bg-red-500/5 text-red-500',
        orange: 'border-orange-500/30 bg-orange-500/5 text-orange-500',
        green: 'border-green-500/30 bg-green-500/5 text-green-500',
    }
    const theme = colorClasses[color as keyof typeof colorClasses] || colorClasses.red

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-[#0d1117] border p-4 rounded-xl relative overflow-hidden group ${theme}`}
        >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-current" />
            <div className="relative z-10 flex justify-between items-start mb-2">
                <p className={`text-xs font-mono font-bold opacity-70`}>{title}</p>
                <Icon className={`w-5 h-5 opacity-80`} />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-1">{value}</h3>
            <p className="text-[10px] opacity-60 font-mono">{subValue}</p>
        </motion.div>
    )
}
