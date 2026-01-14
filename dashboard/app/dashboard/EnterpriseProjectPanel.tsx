import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Rocket, Code, Terminal, Clock, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../providers/AuthProvider'

export function EnterpriseProjectPanel({ userId, isActive }: { userId: string, isActive: boolean }) {
    const { githubToken } = useAuth()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        name: '',
        repoName: '',
        description: '',
        stack: ''
    })

    useEffect(() => {
        fetchProject()
    }, [userId])

    const fetchProject = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'in_progress')
                .single()

            if (error) {
                console.warn('Enterprise panel: projects table query failed (expected for non-enterprise users):', error.message)
                setProject(null)
            } else {
                setProject(data)
            }
        } catch (err) {
            console.warn('Enterprise panel error:', err)
            setProject(null)
        } finally {
            setLoading(false)
        }
    }

    const startProject = async () => {
        if (!formData.name) return

        // Call API to start project
        try {
            const res = await fetch('/api/enterprise/project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    projectName: formData.name,
                    repoName: formData.repoName || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    projectDescription: formData.description,
                    techStack: formData.stack.split(',').map(s => s.trim()),
                    githubToken  // Pass the token from context
                })
            })
            const data = await res.json()
            if (data.success) {
                setProject(data.project)
            } else {
                console.error(data.error)
            }
        } catch (e) {
            console.error(e)
        }
    }

    if (!isActive) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0D1117] border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Rocket className="w-32 h-32 text-amber-500" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                    <Rocket className="w-6 h-6" />
                </span>
                Enterprise Project Builder
            </h2>

            {!project ? (
                <div className="space-y-4 max-w-xl">
                    <p className="text-gray-400">
                        Start a new full-stack project generation. Our AI will build it over 15 days, committing code daily to your GitHub.
                    </p>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none transition-colors"
                                    placeholder="e.g., E-commerce Store"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Repository Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none transition-colors font-mono text-sm"
                                    placeholder="e.g., my-ecommerce-app"
                                    value={formData.repoName}
                                    onChange={e => setFormData({ ...formData, repoName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tech Stack</label>
                            <input
                                type="text"
                                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none transition-colors"
                                placeholder="Next.js, Tailwind, Prisma (comma separated)"
                                value={formData.stack}
                                onChange={e => setFormData({ ...formData, stack: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                            <textarea
                                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none transition-colors h-24 resize-none"
                                placeholder="Describe what you want to build..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={startProject}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-lg transition-all w-full flex items-center justify-center gap-2"
                    >
                        <Rocket className="w-4 h-4" />
                        Start 15-Day Build
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">{project.project_name}</h3>
                            <p className="text-sm text-gray-400">{project.repo_name}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-amber-500">Day {project.current_day} / 15</div>
                            <div className="text-sm text-gray-500">in progress</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-[#21262d] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(project.current_day / 15) * 100}%` }}
                            className="absolute top-0 left-0 h-full bg-amber-500"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                            <Code className="w-5 h-5 text-blue-400 mb-2" />
                            <div className="text-sm text-gray-400">Total Commits</div>
                            <div className="text-xl font-bold text-white">{project.total_commits}</div>
                        </div>
                        <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                            <Terminal className="w-5 h-5 text-green-400 mb-2" />
                            <div className="text-sm text-gray-400">Tech Stack</div>
                            <div className="text-sm font-bold text-white truncate">{project.tech_stack?.join(', ')}</div>
                        </div>
                        <div className="bg-[#161b22] p-4 rounded-xl border border-white/5">
                            <Clock className="w-5 h-5 text-purple-400 mb-2" />
                            <div className="text-sm text-gray-400">Time Remote</div>
                            <div className="text-xl font-bold text-white">{15 - project.current_day} days</div>
                        </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                        <p className="text-amber-400 text-sm flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            Your project is being built automatically. Daily commits will appear in your repository every night.
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
