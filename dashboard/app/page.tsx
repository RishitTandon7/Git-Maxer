'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Github, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './providers/AuthProvider'
import { OwnerStats } from './dashboard/OwnerStats'

type Theme = {
  headingGradient: string
  subHeadingAccent: string
  buttonPrimary: string
  buttonSecondary: string
  navbarButton: string
  gridBorder: string
  gridShadow: string
  gridParticleColor: string
  badgeBg: string
  badgeText: string
  logoText: string
}

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'github' | 'google' | null>(null)
  const [showSocial, setShowSocial] = useState(false)
  const { user: sessionUser, userPlan, loading: authLoading } = useAuth()

  const getTheme = (plan: string | null): Theme => {
    switch (plan) {
      case 'enterprise':
        return {
          headingGradient: 'from-yellow-300 via-amber-500 to-yellow-600',
          subHeadingAccent: 'text-amber-400',
          buttonPrimary: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
          buttonSecondary: 'bg-white/5 border border-amber-500/30 text-white hover:bg-amber-500/10',
          navbarButton: 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 border-amber-400/20',
          gridBorder: 'border-amber-500/30',
          gridShadow: 'shadow-amber-500/10',
          gridParticleColor: 'bg-green-500',
          badgeBg: 'bg-amber-500/10',
          badgeText: 'text-amber-400',
          logoText: 'from-amber-200 to-yellow-500'
        }
      case 'owner':
        return {
          headingGradient: 'from-red-500 via-orange-500 to-red-600',
          subHeadingAccent: 'text-red-500',
          buttonPrimary: 'bg-gradient-to-r from-red-500 to-orange-600 text-white hover:shadow-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]',
          buttonSecondary: 'bg-white/5 border border-red-500/30 text-white hover:bg-red-500/10',
          navbarButton: 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/25 border-red-500/20',
          gridBorder: 'border-red-500/30',
          gridShadow: 'shadow-red-500/10',
          gridParticleColor: 'bg-green-500',
          badgeBg: 'bg-red-500/10',
          badgeText: 'text-red-500',
          logoText: 'from-red-400 to-orange-500'
        }
      case 'pro': // 🔵 Hyper Tech Theme
        return {
          headingGradient: 'from-cyan-300 via-blue-500 to-purple-600',
          subHeadingAccent: 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]',
          buttonPrimary: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.5)] border border-cyan-400/30 ring-1 ring-cyan-400/20',
          buttonSecondary: 'bg-black/40 border border-cyan-500/50 text-cyan-100 hover:bg-cyan-500/20 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-xl',
          navbarButton: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/40 border-cyan-400/40',
          gridBorder: 'border-cyan-500/50',
          gridShadow: 'shadow-[0_0_60px_rgba(6,182,212,0.25)]',
          gridParticleColor: 'bg-cyan-400',
          badgeBg: 'bg-cyan-900/40',
          badgeText: 'text-cyan-300',
          logoText: 'from-cyan-200 via-blue-400 to-purple-400'
        }
      default:
        return {
          headingGradient: 'from-white via-gray-200 to-gray-400',
          subHeadingAccent: 'text-white',
          buttonPrimary: 'bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
          buttonSecondary: 'bg-white/5 border border-white/20 text-white hover:bg-white/10',
          navbarButton: 'bg-white text-black hover:bg-gray-200 shadow-white/10 border-white/20',
          gridBorder: 'border-white/10',
          gridShadow: 'shadow-white/5',
          gridParticleColor: 'bg-green-500',
          badgeBg: 'bg-white/10',
          badgeText: 'text-gray-300',
          logoText: 'from-white to-gray-400'
        }
    }
  }

  const theme = getTheme(userPlan)

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handleHashTokens = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        // Hash handling logic
      }
    }
    handleHashTokens()
  }, [router])

  // Analytics
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          body: JSON.stringify({
            path: window.location.pathname,
            user_agent: navigator.userAgent,
            country: Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[0]
          })
        })
      } catch (e) { }
    }
    trackView()
  }, [])

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

  if (!mounted) return null

  return (
    <div className="h-screen bg-[#050505] text-white selection:bg-white/30 overflow-hidden relative flex flex-col font-sans">

      {/* Admin Control Center Button (Only for Owner) */}
      {(userPlan === 'owner' || sessionUser?.user_metadata?.user_name === 'rishittandon7') && (
        <OwnerStats />
      )}

      {/* Dynamic Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {(() => {
          if (userPlan === 'enterprise') return <GoldenTheme />
          if (userPlan === 'owner') return <RoyalTheme />
          if (userPlan === 'pro') return <HyperTechTheme />
          return (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-[#050505] to-[#050505]" />
              <ClientStars />
            </>
          )
        })()}
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 backdrop-blur-md bg-white/5 border border-white/10 px-4 py-2 rounded-full ${userPlan === 'pro' ? 'shadow-[0_0_20px_rgba(6,182,212,0.3)] border-cyan-500/30' : ''}`}
          >
            <div className="w-8 h-8 relative rounded-full overflow-hidden border border-white/10">
              <img src="/logo.jpg" alt="GitMaxer" className="object-cover w-full h-full" />
            </div>
            <span className={`font-bold text-lg tracking-tight bg-gradient-to-r ${theme.logoText} bg-clip-text text-transparent`}>GitMaxer</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6 text-sm font-medium"
          >
            <Link href="/pricing" className="hidden sm:block text-gray-400 hover:text-white transition-colors">Pricing</Link>
            {sessionUser ? (
              <Link href="/dashboard" className={`px-5 py-2 rounded-full font-bold transition-all shadow-lg border ${theme.navbarButton}`}>
                Dashboard
              </Link>
            ) : (
              <Link href="/pricing" className={`px-5 py-2 rounded-full font-bold transition-all shadow-lg border ${theme.navbarButton}`}>
                Get Pro
              </Link>
            )}
          </motion.div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center relative z-10 px-4">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center space-y-10 sm:space-y-12">

          {/* Hero Section */}
          <div className="text-center space-y-6 relative">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
              className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter px-4 leading-[1.1]"
            >
              Keep your streak <br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-br ${theme.headingGradient} animate-gradient-x relative pb-2`}>
                alive forever.
                {userPlan === 'pro' && (
                  <span className="absolute inset-0 bg-cyan-500/20 blur-[60px] -z-10" />
                )}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed ${userPlan === 'pro' ? 'text-cyan-100/80 drop-shadow-lg' : 'text-gray-400'}`}
            >
              The <span className={`${theme.subHeadingAccent} font-semibold transition-colors`}>AI Assistant</span> that ensures your GitHub contribution graph never goes gray.
            </motion.p>
          </div>

          {/* Realistic GitHub Contribution Graph Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={`p-3 bg-[#0d1117]/80 backdrop-blur-md border rounded-xl shadow-2xl transition-all duration-500 ${theme.gridBorder} ${theme.gridShadow}`}>
              <div className="flex gap-[3px]">
                {[...Array(14)].map((_, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-[3px]">
                    {[...Array(7)].map((_, rowIndex) => {
                      const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
                      return (
                        <motion.div
                          key={rowIndex}
                          initial={{ backgroundColor: '#161b22' }}
                          animate={{ backgroundColor: colors[Math.floor(Math.random() * 5)] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            delay: Math.random() * 2
                          }}
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-[2px]"
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className={`text-xs font-mono flex items-center gap-2 ${theme.badgeText}`}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              CONTRIBUTION STREAK: ACTIVE
            </motion.span>
          </motion.div>

          {/* CTA Buttons - Dynamic */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center pt-2"
          >
            {sessionUser ? (
              <Link href="/dashboard" className={`h-14 px-8 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center ${theme.buttonPrimary}`}>
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => handleLogin('github')}
                  disabled={!!loading}
                  className={`h-14 px-8 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center ${theme.buttonPrimary}`}
                >
                  <Github size={20} />
                  <span>Continue with GitHub</span>
                </button>
                <button
                  onClick={() => handleLogin('google')}
                  disabled={!!loading}
                  className={`h-14 px-8 rounded-full font-medium text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center backdrop-blur-sm ${theme.buttonSecondary}`}
                >
                  <Mail size={20} />
                  <span>Google</span>
                </button>
              </>
            )}
          </motion.div>

        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="absolute bottom-6 w-full text-center text-xs text-white/20">
        <p>
          GitMaxer &copy; 2025. Made by{' '}
          <button onClick={() => setShowSocial(!showSocial)} className="hover:text-white transition-colors">
            Rishit Tandon
          </button>
        </p>
      </footer>
    </div>
  )
}

function ClientStars() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  return (
    <>
      {[...Array(150)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, opacity: Math.random() * 0.7 + 0.3, scale: Math.random() * 0.8 + 0.4 }}
          animate={{ y: [null, Math.random() * -100], opacity: [null, 0] }}
          transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
          style={{ width: Math.random() * 3 + 1 + 'px', height: Math.random() * 3 + 1 + 'px' }}
        />
      ))}
    </>
  )
}

function GoldenTheme() {
  return (
    <div className="absolute inset-0 bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600/20 via-[#050505] to-[#050505]" />
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-yellow-400 rounded-full blur-[1px]"
          initial={{ x: Math.random() * 2000, y: 1000, opacity: 0 }}
          animate={{ y: -100, opacity: [0, 0.8, 0] }}
          transition={{ duration: Math.random() * 4 + 4, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
          style={{ width: Math.random() * 6 + 3 + 'px', height: Math.random() * 6 + 3 + 'px', boxShadow: '0 0 15px rgba(234, 179, 8, 0.8)' }}
        />
      ))}
    </div>
  )
}

function RoyalTheme() {
  return (
    <div className="absolute inset-0 bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/20 via-[#050505] to-[#050505]" />
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-red-500 rounded-full blur-[1px]"
          initial={{ x: Math.random() * 2000, y: 1000, opacity: 0 }}
          animate={{ y: -100, opacity: [0, 0.8, 0] }}
          transition={{ duration: Math.random() * 4 + 4, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
          style={{ width: Math.random() * 6 + 3 + 'px', height: Math.random() * 6 + 3 + 'px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)' }}
        />
      ))}
    </div>
  )
}

function HyperTechTheme() {
  return (
    <div className="absolute inset-0 bg-[#000510] overflow-hidden font-mono">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-[#000510] to-[#000510]" />

      {/* Animated Moving Grid Floor */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[60vh] bg-[linear-gradient(to_right,#06b6d4_1px,transparent_1px),linear-gradient(to_bottom,#06b6d4_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:linear-gradient(to_bottom,transparent_10%,black_100%)] opacity-20"
        style={{ transform: 'perspective(500px) rotateX(60deg)' }}
        animate={{ backgroundPosition: ['0px 0px', '0px 50px'] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />

      {/* Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMik1Ii8+Cjwvc3ZnPg==')] opacity-30 z-20" />

      {/* Binary Rain Code */}
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-cyan-500/30 text-[10px] whitespace-pre flex flex-col items-center leading-none select-none"
          initial={{ y: -500, opacity: 0 }}
          animate={{ y: 1500, opacity: [0, 1, 0] }}
          transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
          style={{ left: `${Math.random() * 100}%` }}
        >
          {'010110'.split('').map((char, j) => <span key={j} style={{ opacity: Math.random() }}>{char}</span>)}
        </motion.div>
      ))}

      {/* Holographic Pulse Ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/20"
        initial={{ width: 0, height: 0, opacity: 1, borderWidth: '2px' }}
        animate={{ width: '150vw', height: '150vw', opacity: 0, borderWidth: '0px' }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Rotating 3D Wireframes */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`wire-${i}`}
          className="absolute border border-cyan-400/20 bg-cyan-900/5 backdrop-blur-[1px]"
          initial={{ rotateX: 0, rotateY: 0, rotateZ: 0 }}
          animate={{ rotateX: 360, rotateY: 180, rotateZ: 90 }}
          transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
          style={{
            left: `${15 + i * 25}%`,
            top: `${20 + (i % 2) * 50}%`,
            width: '100px',
            height: '100px',
            borderRadius: '10%'
          }}
        />
      ))}
    </div>
  )
}
