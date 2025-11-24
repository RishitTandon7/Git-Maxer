'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Github, Mail, Terminal, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null)
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-hidden relative">

      {/* Advanced Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Animated Gradient Mesh */}
        <div className="absolute inset-0 opacity-50">
          <motion.div
            className="absolute top-0 left-0 w-full h-full"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 20%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.3) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Floating Orbs */}
        {mounted && [...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full mix-blend-screen filter blur-xl"
            style={{
              width: Math.random() * 300 + 100,
              height: Math.random() * 300 + 100,
              background: i % 2 === 0
                ? 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, transparent 70%)',
            }}
            animate={{
              x: [0, Math.random() * 400 - 200],
              y: [0, Math.random() * 400 - 200],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
          />
        ))}

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Terminal size={16} className="sm:w-[18px] sm:h-[18px]" strokeWidth={3} />
            </div>
            <span className="hidden sm:inline">GitMaxer</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/features" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <button
              onClick={() => handleLogin('google')}
              disabled={!!loading}
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors px-2 sm:px-0"
            >
              Sign In
            </button>
            <button
              onClick={() => handleLogin('google')}
              disabled={!!loading}
              className="bg-white text-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-20 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-24">

          {/* Hero Section */}
          <motion.div
            className="text-center space-y-6 sm:space-y-8 relative z-10"
            style={{ opacity, scale }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-blue-400 backdrop-blur-sm"
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Automated GitHub Activity</span>
              <span className="sm:hidden">Auto GitHub Activity</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-tight"
            >
              Keep your streak <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                alive forever.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-4"
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
              <div className="relative w-full sm:w-auto">
                <button
                  disabled
                  className="w-full sm:w-auto h-12 px-6 sm:px-8 rounded-full bg-white/10 text-gray-500 font-semibold cursor-not-allowed flex items-center justify-center gap-2 relative"
                >
                  <Github size={20} />
                  <span className="text-sm sm:text-base">Continue with GitHub</span>
                </button>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30 whitespace-nowrap">
                  Coming Soon
                </span>
              </div>
              <button
                onClick={() => handleLogin('google')}
                disabled={!!loading}
                className="w-full sm:w-auto h-12 px-6 sm:px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 backdrop-blur-sm"
              >
                <Mail size={20} />
                <span className="text-sm sm:text-base">{loading === 'google' ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </motion.div>
          </motion.div>

        </div>
      </main>

      <footer className="border-t border-white/5 py-8 sm:py-12 text-center text-gray-500 text-xs sm:text-sm backdrop-blur-sm">
        <p>© 2024 GitMaxer. All rights reserved.</p>
      </footer>
    </div>
  )
}
