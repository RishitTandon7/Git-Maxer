'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Code, Briefcase, AlertTriangle, CheckCircle, XCircle,
    RefreshCw, ArrowLeft, Download, Users, Mail, Clock,
    GitBranch, BookOpen, Zap
} from 'lucide-react'
import Link from 'next/link'

export default function MonitorPage() {
    const [activeTab, setActiveTab] = useState<'leetcode' | 'enterprise' | 'users'>('leetcode')
    const [leetcodeData, setLeetcodeData] = useState<any>(null)
    const [enterpriseData, setEnterpriseData] = useState<any>(null)
    const [freeUsers, setFreeUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [testResult, setTestResult] = useState<any>(null)
    const [testLoading, setTestLoading] = useState(false)

    useEffect(() => {
        fetchAllData()
        const interval = setInterval(fetchAllData, 30000) // Refresh every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchAllData = async () => {
        setLoading(true)
        try {
            const [lcRes, entRes, usersRes] = await Promise.all([
                fetch('/api/monitor/leetcode'),
                fetch('/api/monitor/enterprise'),
                fetch('/api/monitor/free-users')
            ])

            if (lcRes.ok) setLeetcodeData(await lcRes.json())
            if (entRes.ok) setEnterpriseData(await entRes.json())
            if (usersRes.ok) {
                const data = await usersRes.json()
                setFreeUsers(data.users || [])
            }
        } catch (e) {
            console.error('Monitor fetch error:', e)
        } finally {
            setLoading(false)
        }
    }

    const testLeetCodeGeneration = async (problemNumber?: number) => {
        setTestLoading(true)
        setTestResult(null)
        try {
            const res = await fetch('/api/monitor/test-leetcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ problemNumber: problemNumber || Math.floor(Math.random() * 3000) + 1 })
            })
            const data = await res.json()
            setTestResult(data)
        } catch (e: any) {
            setTestResult({ error: e.message })
        } finally {
            setTestLoading(false)
        }
    }

    const exportFreeUsersCSV = () => {
        if (freeUsers.length === 0) return

        const headers = ['Username', 'Email', 'Created At', 'Last Commit', 'Status']
        const rows = freeUsers.map(u => [
            u.github_username || 'N/A',
            u.email || 'N/A',
            u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A',
            u.last_commit_ts ? new Date(u.last_commit_ts).toLocaleDateString() : 'Never',
            u.pause_bot ? 'Paused' : 'Active'
        ])

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `free_users_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-[#050505] to-[#050505]" />
            </div>

            <main className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-2">
                                <Zap className="w-8 h-8 text-purple-500" />
                                Feature Monitor
                            </h1>
                            <p className="text-xs text-purple-500/60 font-mono tracking-widest uppercase">
                                LeetCode & Enterprise Tracking
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAllData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6">
                    {[
                        { id: 'leetcode', label: 'LeetCode Monitor', icon: Code, color: 'purple' },
                        { id: 'enterprise', label: 'Enterprise Monitor', icon: Briefcase, color: 'amber' },
                        { id: 'users', label: 'Free Users Export', icon: Users, color: 'green' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id
                                    ? `bg-${tab.color}-500/20 text-${tab.color}-400 border border-${tab.color}-500/50`
                                    : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'leetcode' && (
                    <LeetCodeMonitor
                        data={leetcodeData}
                        testResult={testResult}
                        testLoading={testLoading}
                        onTest={testLeetCodeGeneration}
                    />
                )}

                {activeTab === 'enterprise' && (
                    <EnterpriseMonitor data={enterpriseData} />
                )}

                {activeTab === 'users' && (
                    <FreeUsersPanel users={freeUsers} onExport={exportFreeUsersCSV} />
                )}
            </main>
        </div>
    )
}

function LeetCodeMonitor({ data, testResult, testLoading, onTest }: any) {
    const [testProblem, setTestProblem] = useState('')

    return (
        <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatusCard
                    title="LeetCode Users"
                    value={data?.leetcodeUsers || 0}
                    icon={Users}
                    color="purple"
                />
                <StatusCard
                    title="Problems Solved Today"
                    value={data?.solvedToday || 0}
                    icon={CheckCircle}
                    color="green"
                />
                <StatusCard
                    title="Failed Generations"
                    value={data?.failedToday || 0}
                    icon={XCircle}
                    color="red"
                />
                <StatusCard
                    title="API Health"
                    value={data?.apiHealth || 'Unknown'}
                    icon={Zap}
                    color={data?.apiHealth === 'OK' ? 'green' : 'orange'}
                />
            </div>

            {/* Test LeetCode Generation */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
                    <Code className="w-5 h-5 text-purple-500" />
                    Test LeetCode Generation
                </h3>
                <div className="flex gap-4 mb-4">
                    <input
                        type="number"
                        placeholder="Problem # (1-3000) or leave empty for random"
                        value={testProblem}
                        onChange={(e) => setTestProblem(e.target.value)}
                        className="flex-1 px-4 py-2 bg-black/50 border border-white/20 rounded-lg text-white"
                    />
                    <button
                        onClick={() => onTest(testProblem ? parseInt(testProblem) : undefined)}
                        disabled={testLoading}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {testLoading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Test Generation
                            </>
                        )}
                    </button>
                </div>

                {testResult && (
                    <div className={`p-4 rounded-lg border ${testResult.error
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-green-500/10 border-green-500/30'
                        }`}>
                        {testResult.error ? (
                            <div className="text-red-400">
                                <p className="font-bold flex items-center gap-2">
                                    <XCircle className="w-4 h-4" />
                                    Generation Failed
                                </p>
                                <pre className="mt-2 text-xs overflow-auto max-h-40">{testResult.error}</pre>
                            </div>
                        ) : (
                            <div className="text-green-400">
                                <p className="font-bold flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Problem #{testResult.problemNumber}: {testResult.title}
                                </p>
                                <div className="flex gap-4 text-xs text-gray-400 mb-2">
                                    <span>Difficulty: {testResult.difficulty}</span>
                                    <span>Model: {testResult.modelUsed}</span>
                                    <span>Time: {testResult.generationTime}ms</span>
                                </div>
                                <pre className="bg-black/50 p-3 rounded text-xs overflow-auto max-h-60 text-gray-300">
                                    {testResult.codePreview}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Recent LeetCode Activity */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    Recent LeetCode Commits
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data?.recentCommits?.length > 0 ? (
                        data.recentCommits.map((commit: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-xs font-bold text-purple-400">
                                        {commit.username?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{commit.username}</p>
                                        <p className="text-xs text-gray-500">
                                            Problem #{commit.problemNumber}: {commit.title}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {new Date(commit.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-600 py-8">No recent LeetCode activity</p>
                    )}
                </div>
            </div>

            {/* Token Health */}
            {data?.tokenIssues?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                    <h3 className="font-bold text-red-400 flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5" />
                        Users with Token Issues ({data.tokenIssues.length})
                    </h3>
                    <div className="space-y-2">
                        {data.tokenIssues.map((user: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                                <span className="text-white">{user.username}</span>
                                <span className="text-xs text-red-400">{user.error}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function EnterpriseMonitor({ data }: any) {
    return (
        <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatusCard
                    title="Enterprise Users"
                    value={data?.enterpriseUsers || 0}
                    icon={Users}
                    color="amber"
                />
                <StatusCard
                    title="Active Projects"
                    value={data?.activeProjects || 0}
                    icon={Briefcase}
                    color="blue"
                />
                <StatusCard
                    title="Commits Today"
                    value={data?.commitsToday || 0}
                    icon={GitBranch}
                    color="green"
                />
                <StatusCard
                    title="Failed Today"
                    value={data?.failedToday || 0}
                    icon={XCircle}
                    color="red"
                />
            </div>

            {/* Active Projects */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-gray-200 flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-amber-500" />
                    Active Enterprise Projects
                </h3>
                <div className="space-y-4">
                    {data?.projects?.length > 0 ? (
                        data.projects.map((project: any, i: number) => (
                            <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="text-white font-bold">{project.project_name}</h4>
                                        <p className="text-xs text-gray-500">by {project.username}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs ${project.status === 'in_progress'
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : project.status === 'completed'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-400">Progress</span>
                                        <span className="text-amber-400">
                                            Day {project.current_day}/{project.days_duration}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
                                            style={{ width: `${(project.current_day / project.days_duration) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 text-xs text-gray-500">
                                    <span>Repo: {project.repo_name}</span>
                                    <span>Tech: {project.tech_stack?.join(', ') || 'N/A'}</span>
                                    <span>Commits: {project.total_commits || 0}</span>
                                </div>

                                {project.lastError && (
                                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                                        Last Error: {project.lastError}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-600 py-8">No active enterprise projects</p>
                    )}
                </div>
            </div>

            {/* Token Issues */}
            {data?.tokenIssues?.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                    <h3 className="font-bold text-red-400 flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5" />
                        Enterprise Users with Token Issues
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                        These users need to re-authenticate. Consider notifying them directly.
                    </p>
                    <div className="space-y-2">
                        {data.tokenIssues.map((user: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                                <div>
                                    <span className="text-white">{user.username}</span>
                                    <span className="text-xs text-gray-500 ml-2">({user.email})</span>
                                </div>
                                <span className="text-xs text-red-400">{user.error}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

function FreeUsersPanel({ users, onExport }: { users: any[]; onExport: () => void }) {
    return (
        <div className="space-y-6">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-200 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-500" />
                        Free Users ({users.length})
                    </h3>
                    <button
                        onClick={onExport}
                        disabled={users.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/10 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="p-3">Username</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Created</th>
                                <th className="p-3">Last Commit</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.length > 0 ? (
                                users.map((user, i) => (
                                    <tr key={i} className="hover:bg-white/5">
                                        <td className="p-3 text-white font-medium">
                                            {user.github_username || 'N/A'}
                                        </td>
                                        <td className="p-3 text-gray-400 flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            {user.email || 'No email'}
                                        </td>
                                        <td className="p-3 text-gray-500 text-xs">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-3 text-gray-500 text-xs">
                                            {user.last_commit_ts ? new Date(user.last_commit_ts).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-3">
                                            <span className={`text-xs px-2 py-1 rounded ${user.pause_bot
                                                    ? 'bg-gray-500/20 text-gray-400'
                                                    : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {user.pause_bot ? 'Paused' : 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-600">
                                        No free users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notification Ideas */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                <h3 className="font-bold text-blue-400 flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5" />
                    Notification Options
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div className="p-4 bg-white/5 rounded-lg">
                        <h4 className="font-bold text-white mb-2">📧 Email Campaign</h4>
                        <p className="text-xs text-gray-500">Use the exported CSV with Mailchimp, SendGrid, or Brevo to send bulk emails.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                        <h4 className="font-bold text-white mb-2">📱 PWA Push Notifications</h4>
                        <p className="text-xs text-gray-500">Add service worker to Git-Maxer for browser push notifications.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatusCard({ title, value, icon: Icon, color }: any) {
    const colors: Record<string, string> = {
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        red: 'text-red-500 bg-red-500/10 border-red-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    }
    const theme = colors[color] || colors.purple

    return (
        <div className={`p-4 rounded-xl border ${theme.split(' ')[2]} bg-[#0d1117] relative overflow-hidden`}>
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Icon className={`w-12 h-12 ${theme.split(' ')[0]}`} />
            </div>
            <h3 className="text-xs font-bold text-gray-400 tracking-wider mb-2">{title}</h3>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    )
}
