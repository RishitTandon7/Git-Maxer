'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitBranch, Sparkles } from 'lucide-react'

interface RepoSetupModalProps {
    onClose: () => void
    onSetup: (repoName: string, autoCreate: boolean) => Promise<void>
    planType: 'leetcode' | 'enterprise'
}

export function RepoSetupModal({ onClose, onSetup, planType }: RepoSetupModalProps) {
    const [repoName, setRepoName] = useState(
        planType === 'leetcode' ? 'LeetCode-Solutions' : 'MyProject'
    )
    const [autoCreate, setAutoCreate] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const isLeetCode = planType === 'leetcode'
    const defaultRepoName = isLeetCode ? 'LeetCode-Solutions' : 'GitMaxer-Enterprise-Project'

    const handleSubmit = async () => {
        if (!repoName.trim()) {
            setError('Please enter a repository name')
            return
        }

        // Validate repo name (GitHub rules)
        const validRepoName = /^[a-zA-Z0-9_.-]+$/
        if (!validRepoName.test(repoName)) {
            setError('Repository name can only contain letters, numbers, hyphens, underscores, and dots')
            return
        }

        setLoading(true)
        setError('')

        try {
            await onSetup(repoName, autoCreate)
            onClose()
        } catch (err: any) {
            setError(err.message || 'Failed to setup repository')
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-gradient-to-b ${isLeetCode
                        ? 'from-purple-900/90 to-black'
                        : 'from-amber-900/90 to-black'
                    } border ${isLeetCode
                        ? 'border-purple-500/50'
                        : 'border-amber-500/50'
                    } rounded-2xl p-8 max-w-md w-full relative overflow-hidden`}
            >
                {/* Animated background */}
                <motion.div
                    className={`absolute inset-0 opacity-20 ${isLeetCode
                            ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                            : 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20'
                        }`}
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        repeatType: 'reverse',
                    }}
                />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 ${isLeetCode ? 'text-purple-400 hover:text-purple-300' : 'text-amber-400 hover:text-amber-300'
                        } transition-colors`}
                >
                    <X size={24} />
                </button>

                <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-full ${isLeetCode ? 'bg-purple-500/20' : 'bg-amber-500/20'
                        } flex items-center justify-center mb-4`}>
                        {isLeetCode ? (
                            <Sparkles className="text-purple-400" size={32} />
                        ) : (
                            <GitBranch className="text-amber-400" size={32} />
                        )}
                    </div>

                    {/* Title */}
                    <h2 className={`text-2xl font-bold mb-2 ${isLeetCode
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400'
                            : 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400'
                        }`}>
                        {isLeetCode ? '💻 Setup LeetCode Repo' : '💼 Setup Project Repo'}
                    </h2>

                    <p className="text-gray-300 mb-6">
                        {isLeetCode
                            ? 'Where should we upload your daily LeetCode solutions?'
                            : 'Where should we upload your enterprise project files?'}
                    </p>

                    {/* Auto-create option */}
                    <div className={`mb-4 p-4 rounded-lg border ${isLeetCode
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-amber-500/10 border-amber-500/30'
                        }`}>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoCreate}
                                onChange={(e) => setAutoCreate(e.target.checked)}
                                className={`w-5 h-5 rounded ${isLeetCode ? 'accent-purple-500' : 'accent-amber-500'
                                    }`}
                            />
                            <div>
                                <div className="font-medium text-white">
                                    ✨ Auto-create repository
                                </div>
                                <div className="text-sm text-gray-400">
                                    We'll create the repo for you on GitHub
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Repository name input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Repository Name
                        </label>
                        <input
                            type="text"
                            value={repoName}
                            onChange={(e) => setRepoName(e.target.value)}
                            placeholder={defaultRepoName}
                            className={`w-full px-4 py-3 bg-black/50 border ${isLeetCode ? 'border-purple-500/30' : 'border-amber-500/30'
                                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-${isLeetCode ? 'purple' : 'amber'
                                }-500 transition-colors`}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            {autoCreate
                                ? 'This repo will be created automatically'
                                : 'Make sure this repo exists in your GitHub account'}
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex-1 px-4 py-3 ${isLeetCode
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-600'
                                } rounded-lg text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50`}
                        >
                            {loading ? 'Setting up...' : 'Continue'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
