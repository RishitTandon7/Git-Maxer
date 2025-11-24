'use client'

import { motion } from 'framer-motion'
import { Cpu, ShieldCheck, Terminal } from 'lucide-react'
import Link from 'next/link'

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden relative">

            {/* Interactive Star Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                            opacity: Math.random() * 0.5 + 0.3,
                            scale: Math.random() * 0.5 + 0.5
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [null, 0]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: Math.random() * 2 + 1 + 'px',
                            height: Math.random() * 2 + 1 + 'px',
                        }}
                    />
                ))}
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
                            <Terminal size={18} strokeWidth={3} />
                        </div>
                        GitMaxer
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/features" className="text-sm text-white font-semibold transition-colors">Features</Link>
                        <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
                        <Link href="/" className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto space-y-24">

                    {/* Header */}
                    <div className="text-center space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl md:text-7xl font-bold tracking-tighter"
                        >
                            Powerful Features
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto"
                        >
                            Everything you need to maintain your GitHub streak automatically.
                        </motion.p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        {/* AI Tech */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden group min-h-[300px] flex flex-col justify-between"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div>
                                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-4">
                                    <Cpu size={24} />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Gemini Powered AI</h3>
                                <p className="text-gray-400 max-w-md">
                                    Uses Google's advanced AI to generate unique, meaningful code snippets every single time.
                                    No more repetitive "Hello World" commits.
                                </p>
                            </div>
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px]" />

                            {/* Decorative Code Block */}
                            <div className="absolute top-8 right-8 hidden md:block opacity-20 font-mono text-xs text-green-400">
                                <div>def generate_code():</div>
                                <div className="pl-4">return gemini.ask(</div>
                                <div className="pl-8">"Write a unique snippet"</div>
                                <div className="pl-4">)</div>
                            </div>
                        </motion.div>

                        {/* Security */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 mb-4">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">100% Secure</h3>
                            <p className="text-gray-400">
                                Your keys are encrypted. We never store your personal access tokens in plain text.
                            </p>
                        </motion.div>

                    </div>

                </div>
            </main>

            <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm relative z-10">
                <p>© 2024 GitMaxer. All rights reserved.</p>
            </footer>
        </div>
    )
}
