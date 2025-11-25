'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Terminal, Code, Github, Zap, Lock, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SetupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1)

    const [formData, setFormData] = useState({
        github_username: '',
        repo_name: 'auto-contributions',
        repo_visibility: 'public',
        preferred_language: 'any',
        commit_time: 'random',
        specific_time: '09:00',
        min_contributions: 1,
        pause_bot: false
    })

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: existingSettings } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            const settingsData = {
                user_id: user.id,
                github_username: formData.github_username,
                repo_name: formData.repo_name,
                repo_visibility: formData.repo_visibility,
                preferred_language: formData.preferred_language,
                commit_time: formData.commit_time === 'random' ? null : formData.specific_time,
                min_contributions: formData.min_contributions,
                pause_bot: formData.pause_bot
            }

            let error

            if (existingSettings) {
                const result = await supabase
                    .from('user_settings')
                    .update(settingsData)
                    .eq('user_id', user.id)
                error = result.error
            } else {
                const result = await supabase
                    .from('user_settings')
                    .insert(settingsData)
                error = result.error
            }

            if (error) {
                console.error('Database error:', error)
                throw error
            }

            router.push('/dashboard')
        } catch (error: any) {
            console.error('Error saving settings:', error)
            alert(`Failed to save settings: ${error.message || 'Please try again.'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleRepoCheck = async () => {
        if (!formData.github_username || !formData.repo_name) return

        setLoading(true)
        try {
            const response = await fetch('/api/setup-repo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo_name: formData.repo_name,
                    visibility: formData.repo_visibility,
                    github_username: formData.github_username
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify repository')
            }

            // Success!
            alert(data.status === 'created' ? '✅ Repository created successfully!' : '✅ Repository found!')
            setStep(2)

        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const languages = [
        { value: 'any', label: 'Any Language (AI Chooses)' },
        { value: 'python', label: 'Python' },
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'java', label: 'Java' },
        { value: 'cpp', label: 'C++' },
        { value: 'go', label: 'Go' },
        { value: 'rust', label: 'Rust' },
        { value: 'ruby', label: 'Ruby' },
    ]

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden relative">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
            </div>

            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
                            <Terminal size={18} strokeWidth={3} />
                        </div>
                        GitMaxer
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-2xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 mb-12">
                        <h1 className="text-5xl font-bold tracking-tighter">Setup Your Bot</h1>
                        <p className="text-gray-400 text-lg">Configure your preferences to get started</p>
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <div className={`h-2 w-16 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-white/10'}`} />
                            <div className={`h-2 w-16 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-white/10'}`} />
                            <div className={`h-2 w-16 rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-white/10'}`} />
                        </div>
                    </motion.div>

                    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSubmit} className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 space-y-8">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                                        <Github size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">GitHub Configuration</h3>
                                        <p className="text-sm text-gray-400">Connect your account and choose a repository</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">GitHub Username</label>
                                    <input type="text" required value={formData.github_username} onChange={(e) => setFormData({ ...formData, github_username: e.target.value })} placeholder="octocat" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors" />
                                    <p className="text-xs text-gray-500 mt-2">This should match your GitHub account username</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Repository Name</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 font-mono">{formData.github_username || 'username'}/</span>
                                        <input type="text" required value={formData.repo_name} onChange={(e) => setFormData({ ...formData, repo_name: e.target.value })} placeholder="auto-contributions" className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Bot will create this repository if it doesn't exist</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Repository Visibility</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${formData.repo_visibility === 'public' ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                            <input type="radio" name="repo_visibility" value="public" checked={formData.repo_visibility === 'public'} onChange={(e) => setFormData({ ...formData, repo_visibility: e.target.value })} className="hidden" />
                                            <Globe className={`w-6 h-6 ${formData.repo_visibility === 'public' ? 'text-blue-400' : 'text-gray-400'}`} />
                                            <div className="text-center">
                                                <div className="font-medium">Public</div>
                                                <div className="text-xs text-gray-400">Visible to everyone</div>
                                            </div>
                                        </label>
                                        <label className={`flex flex-col items-center gap-2 p-4 border rounded-xl cursor-pointer transition-all ${formData.repo_visibility === 'private' ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                            <input type="radio" name="repo_visibility" value="private" checked={formData.repo_visibility === 'private'} onChange={(e) => setFormData({ ...formData, repo_visibility: e.target.value })} className="hidden" />
                                            <Lock className={`w-6 h-6 ${formData.repo_visibility === 'private' ? 'text-blue-400' : 'text-gray-400'}`} />
                                            <div className="text-center">
                                                <div className="font-medium">Private</div>
                                                <div className="text-xs text-gray-400">Only you can see</div>
                                            </div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        {formData.repo_visibility === 'public'
                                            ? "✅ Recommended! Contributions will show on your profile graph."
                                            : "⚠️ Contributions in private repos won't show on your public graph."}
                                    </p>
                                </div>

                                <button type="button" onClick={handleRepoCheck} disabled={!formData.github_username || !formData.repo_name || loading} className="w-full py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {loading ? 'Verifying Repository...' : 'Continue'}
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400">
                                        <Code size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Preferences</h3>
                                        <p className="text-sm text-gray-400">Customize your bot behavior</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Preferred Language</label>
                                    <select value={formData.preferred_language} onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors">
                                        {languages.map(lang => (
                                            <option key={lang.value} value={lang.value} className="bg-[#0A0A0A]">{lang.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">AI will generate code in this language (or any if set to "Any")</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Commit Time</label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                            <input type="radio" name="commit_time" value="random" checked={formData.commit_time === 'random'} onChange={(e) => setFormData({ ...formData, commit_time: e.target.value })} className="w-4 h-4" />
                                            <div className="flex-1">
                                                <div className="font-medium">Random Time</div>
                                                <div className="text-xs text-gray-400">Commit at a random time each day (more natural)</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                            <input type="radio" name="commit_time" value="specific" checked={formData.commit_time === 'specific'} onChange={(e) => setFormData({ ...formData, commit_time: e.target.value })} className="w-4 h-4" />
                                            <div className="flex-1">
                                                <div className="font-medium">Specific Time</div>
                                                <div className="text-xs text-gray-400">Choose a fixed time for daily commits</div>
                                            </div>
                                        </label>
                                    </div>
                                    {formData.commit_time === 'specific' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3">
                                            <input type="time" value={formData.specific_time} onChange={(e) => setFormData({ ...formData, specific_time: e.target.value })} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 transition-colors" />
                                        </motion.div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors">Back</button>
                                    <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors">Continue</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Advanced Settings</h3>
                                        <p className="text-sm text-gray-400">Fine-tune your bot</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Minimum Daily Contributions: <span className="text-blue-400">{formData.min_contributions}</span>
                                    </label>
                                    <input type="range" min="1" max="10" value={formData.min_contributions} onChange={(e) => setFormData({ ...formData, min_contributions: parseInt(e.target.value) })} className="w-full" />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>1</span>
                                        <span>10</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Bot will only commit if you have fewer than this many contributions today</p>
                                </div>
                                <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                    <input type="checkbox" checked={formData.pause_bot} onChange={(e) => setFormData({ ...formData, pause_bot: e.target.checked })} className="w-4 h-4" />
                                    <div className="flex-1">
                                        <div className="font-medium">Start Paused</div>
                                        <div className="text-xs text-gray-400">You can activate the bot later from your dashboard</div>
                                    </div>
                                </label>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors">Back</button>
                                    <button type="submit" disabled={loading} className="flex-1 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                                        {loading ? 'Saving...' : 'Complete Setup'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </motion.form>
                </div>
            </main>
        </div>
    )
}
