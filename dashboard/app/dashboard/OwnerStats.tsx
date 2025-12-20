'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, Eye, Activity, TrendingUp } from 'lucide-react'

export function OwnerStats() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats')
                const data = await res.json()
                if (!data.error) setStats(data)
            } catch (e) {
                console.error("Stats error", e)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()

        // Poll every 30s for "Live" feel
        const interval = setInterval(fetchStats, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading) return <div className="animate-pulse h-24 bg-white/5 rounded-lg mb-8"></div>

    if (!stats) return null

    return (
        <div className="mb-8 p-1">
            <h2 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Owner Command Center
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Live Users */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0d1117]/80 border border-amber-500/30 p-4 rounded-xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-xs text-amber-500/70 font-mono mb-1">LIVE USERS</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">{stats.liveUsers}</h3>
                        </div>
                        <Users className="w-5 h-5 text-amber-500" />
                    </div>
                </motion.div>

                {/* Total Revenue */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0d1117]/80 border border-green-500/30 p-4 rounded-xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-xs text-green-500/70 font-mono mb-1">REVENUE</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">₹{stats.totalRevenue}</h3>
                        </div>
                        <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                </motion.div>

                {/* Total Users */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0d1117]/80 border border-blue-500/30 p-4 rounded-xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-xs text-blue-500/70 font-mono mb-1">TOTAL USERS</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">{stats.totalUsers}</h3>
                        </div>
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                </motion.div>

                {/* Page Views */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0d1117]/80 border border-purple-500/30 p-4 rounded-xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-xs text-purple-500/70 font-mono mb-1">TOTAL VIEWS</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">{stats.totalViews}</h3>
                        </div>
                        <Eye className="w-5 h-5 text-purple-500" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
