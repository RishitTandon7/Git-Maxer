'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Github, Mail, Terminal, Instagram } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null)
  const [showSocial, setShowSocial] = useState(false)

  const handleLogin = async (provider: 'github' | 'google') => {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'github' ? 'repo' : undefined,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) alert(error.message)
    setLoading(null)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden relative flex flex-col">

      {/* Interactive Star Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
        {/* Only render stars on client to avoid hydration mismatch */}
        <ClientStars />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-xl overflow-hidden">
              <img src="/logo.jpg" alt="GitMaxer Logo" className="object-cover w-full h-full" />
            </div>
            <span className="hidden xs:inline">GitMaxer</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/features" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="/pricing" className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors">Pricing</Link>
            <button
              onClick={() => handleLogin('google')}
              disabled={!!loading}
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => handleLogin('google')}
              disabled={!!loading}
              className="bg-white text-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-24 w-full">

          {/* Hero Section */}
          <div className="text-center space-y-5 sm:space-y-8 relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tighter px-4"
            >
              Keep your streak <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                alive forever.
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.3 + index * 0.1,
                      duration: 0.3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm bg-green-500"
                    style={{
                      opacity: 0.3 + (index * 0.1)
                    }}
                  />
                ))}
              </div>
              <span className="text-xs sm:text-sm text-blue-400 font-medium">Automated GitHub Activity</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed px-4"
            >
              The AI-powered assistant that ensures your GitHub contribution graph never goes gray.
              Set it, forget it, and let the green squares roll in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 sm:pt-4 px-4"
            >
              <button
                onClick={() => handleLogin('github')}
                disabled={!!loading}
                className="h-12 w-full sm:w-auto px-6 sm:px-8 rounded-full bg-white/10 text-gray-400 font-semibold hover:bg-white/15 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Github size={20} />
                <span className="text-sm sm:text-base">{loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}</span>
              </button>
              <button
                onClick={() => handleLogin('google')}
                disabled={!!loading}
                className="h-12 w-full sm:w-auto px-6 sm:px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail size={20} />
                <span className="text-sm sm:text-base">{loading === 'google' ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </motion.div>
          </div>



        </div>
      </main>

      <footer className="relative border-t border-white/5 py-6 text-center text-gray-500 text-xs mt-auto">
        <p>
          © 2024 GitMaxer. Made by{' '}
          <button
            onClick={() => setShowSocial(!showSocial)}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium relative inline-block"
          >
            Rishit Tandon
            {showSocial && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-3 shadow-2xl w-48"
              >
                <div className="flex flex-col gap-2">
                  <a
                    href="https://instagram.com/kingrishit2.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-colors text-white text-sm"
                  >
                    <Instagram size={16} />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="https://github.com/rishittandon7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-colors text-white text-sm"
                  >
                    <Github size={16} />
                    <span>GitHub</span>
                  </a>
                </div>
              </motion.div>
            )}
          </button>
        </p>
      </footer>
    </div>
  )
}

function ClientStars() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {[...Array(150)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.7 + 0.3,
            scale: Math.random() * 0.8 + 0.4
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
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
          }}
        />
      ))}
    </>
  )
}
