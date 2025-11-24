'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Github, Mail, Terminal } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null)

  const handleLogin = async (provider: 'github' | 'google') => {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) alert(error.message)
    setLoading(null)
  }

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
            <Link href="/features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <button
              onClick={() => handleLogin('google')}
              disabled={!!loading}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => handleLogin('google')}
              disabled={!!loading}
              className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-24">

          {/* Hero Section */}
          <div className="text-center space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-blue-400"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Automated GitHub Activity
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter"
            >
              Keep your streak <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                alive forever.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
            >
              The AI-powered assistant that ensures your GitHub contribution graph never goes gray.
              Set it, forget it, and let the green squares roll in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <div className="relative">
                <button
                  disabled
                  className="h-12 px-8 rounded-full bg-white/10 text-gray-500 font-semibold cursor-not-allowed flex items-center gap-2 relative"
                >
                  <Github size={20} />
                  Continue with GitHub
                </button>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30 whitespace-nowrap">
                  Coming Soon
                </span>
              </div>
              <button
                onClick={() => handleLogin('google')}
                disabled={!!loading}
                className="h-12 px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Mail size={20} />
                {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
              </button>
            </motion.div>
          </div>



        </div>
      </main>

      <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm">
        <p>© 2024 GitMaxer. All rights reserved.</p>
      </footer>
    </div>
  )
}
