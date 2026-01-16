'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Github, Mail, BookOpen, Users, FolderGit2, ChevronDown, X, Sparkles, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from './providers/AuthProvider'
import { OwnerStats } from './dashboard/OwnerStats'
import { useTutorial } from './components/TutorialOverlay'

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

  const handleLogout = async () => {
    try {
      // 1. Clear Supabase Session first (it might fail if network is bad, but try anyway)
      const { error } = await supabase.auth.signOut()
      if (error) console.error('Supabase signout error:', error)

      // 2. Call API to clear server cookies (robust server-side clear)
      await fetch('/api/auth/signout', { method: 'POST', cache: 'no-store' })

      // 3. Clear all Local Storage & Session Storage
      if (typeof window !== 'undefined') {
        window.localStorage.clear()
        window.sessionStorage.clear()

        // 4. Aggressively clear cookies for root path
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }

      // 5. Force Hard Reload to Root
      window.location.replace('/')
    } catch (e) {
      console.error('Logout Exception:', e)
      // Fallback: Force reload anyway
      window.location.replace('/')
    }
  }
  const [showSocial, setShowSocial] = useState(false)
  const { user: sessionUser, userPlan, loading: authLoading } = useAuth()

  // New states for logo dropdown and modals
  const [showLogoDropdown, setShowLogoDropdown] = useState(false)
  const [activeModal, setActiveModal] = useState<'tutorial' | 'about' | 'projects' | null>(null)
  const [showTapHint, setShowTapHint] = useState(true)

  // Interactive tutorial
  const { startTutorial } = useTutorial()

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
      case 'leetcode': // 💻 Purple/Green Code Theme
        return {
          headingGradient: 'from-purple-400 via-pink-500 to-purple-600',
          subHeadingAccent: 'text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]',
          buttonPrimary: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.5)] border border-purple-400/30 ring-1 ring-purple-400/20',
          buttonSecondary: 'bg-black/40 border border-purple-500/50 text-purple-100 hover:bg-purple-500/20 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] backdrop-blur-xl',
          navbarButton: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-purple-500/40 border-purple-400/40',
          gridBorder: 'border-purple-500/50',
          gridShadow: 'shadow-[0_0_60px_rgba(168,85,247,0.25)]',
          gridParticleColor: 'bg-purple-400',
          badgeBg: 'bg-purple-900/40',
          badgeText: 'text-purple-300',
          logoText: 'from-purple-200 via-pink-400 to-purple-400'
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

  // Instant owner detection for theme
  const effectivePlan = sessionUser?.user_metadata?.user_name === 'rishittandon7'
    ? 'owner'
    : userPlan

  const theme = getTheme(effectivePlan)

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
          if (effectivePlan === 'enterprise') return <GoldenTheme />
          if (effectivePlan === 'owner') return <RoyalTheme />
          if (effectivePlan === 'pro') return <HyperTechTheme />
          if (effectivePlan === 'leetcode') return <LeetCodeTheme />
          return (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800/20 via-[#050505] to-[#050505]" />
              <ClientStars />
            </>
          )
        })()}
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 px-4 sm:px-6 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo with Dropdown (Mobile: clickable, Desktop: shows links) */}
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                setShowLogoDropdown(!showLogoDropdown)
                setShowTapHint(false)
              }}
              data-tutorial="logo"
              className={`flex items-center gap-2 sm:gap-3 backdrop-blur-md bg-white/5 border border-white/10 px-3 sm:px-4 py-2 rounded-full cursor-pointer hover:bg-white/10 transition-all ${userPlan === 'pro' ? 'shadow-[0_0_20px_rgba(6,182,212,0.3)] border-cyan-500/30' : ''} ${showTapHint ? 'animate-pulse-glow' : ''}`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 relative rounded-full overflow-hidden border border-white/10">
                <img src="/logo.jpg" alt="GitMaxer" className="object-cover w-full h-full" />
              </div>
              <span className={`font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r ${theme.logoText} bg-clip-text text-transparent`}>GitMaxer</span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 sm:hidden ${showLogoDropdown ? 'rotate-180' : ''}`}
              />
            </motion.button>

            {/* Tap Hint Animation - Mobile Only */}
            {showTapHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute -right-3 -bottom-3 sm:hidden pointer-events-none"
              >
                <div className="relative">
                  <span className="text-2xl animate-finger-point inline-block">👆</span>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-8 -right-2 bg-white/90 text-black text-[10px] px-2 py-1 rounded-full whitespace-nowrap font-medium shadow-lg"
                  >
                    Tap me!
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Dropdown Menu */}
            {showLogoDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLogoDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 w-64 backdrop-blur-xl bg-black/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2">
                    {/* Tutorial */}
                    <button
                      onClick={() => {
                        setActiveModal('tutorial')
                        setShowLogoDropdown(false)
                      }}
                      data-tutorial="tutorial-link"
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Tutorial</p>
                        <p className="text-gray-400 text-xs">Learn how to use GitMaxer</p>
                      </div>
                    </button>

                    {/* Community */}
                    <a
                      href="https://chat.whatsapp.com/LDdiCn2GGf9EI4KvlZ5e4i"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowLogoDropdown(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                        <span className="text-xl">💬</span>
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Community</p>
                        <p className="text-gray-400 text-xs">Join our WhatsApp group</p>
                      </div>
                    </a>                    {/* About Us */}
                    <button
                      onClick={() => {
                        setActiveModal('about')
                        setShowLogoDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Users size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">About Us</p>
                        <p className="text-gray-400 text-xs">Meet the creator</p>
                      </div>
                    </button>

                    {/* Other Projects */}
                    <button
                      onClick={() => {
                        setActiveModal('projects')
                        setShowLogoDropdown(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <FolderGit2 size={20} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-semibold text-sm">Other Projects</p>
                        <p className="text-gray-400 text-xs">More by Rishit Tandon</p>
                      </div>
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="border-t border-white/10 p-3 bg-white/5">
                    {sessionUser ? (
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    ) : (
                      <p className="text-[10px] text-gray-500 text-center">
                        Made with 💚 by Rishit Tandon
                      </p>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 sm:gap-6 text-sm font-medium"
          >
            {/* Desktop-only links */}
            <div className="hidden md:flex items-center gap-5">
              <button
                onClick={() => setActiveModal('tutorial')}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <BookOpen size={16} />
                <span>Tutorial</span>
              </button>
              <button
                onClick={() => setActiveModal('about')}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Users size={16} />
                <span>About</span>
              </button>
              <button
                onClick={() => setActiveModal('projects')}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <FolderGit2 size={16} />
                <span>Projects</span>
              </button>
            </div>

            <Link href="/pricing" data-tutorial="pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
            {sessionUser ? (
              <Link href="/dashboard" className={`px-4 sm:px-5 py-2 rounded-full font-bold transition-all shadow-lg border text-xs sm:text-sm ${theme.navbarButton}`}>
                Dashboard
              </Link>
            ) : (
              <button onClick={() => setActiveModal('tutorial')} className={`px-4 sm:px-5 py-2 rounded-full font-bold transition-all shadow-lg border text-xs sm:text-sm ${theme.navbarButton}`}>
                Tutorial
              </button>
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
              {sessionUser?.user_metadata?.user_name === 'rishittandon7' ? (
                <>Hi Boss, I am your <span className={`${theme.subHeadingAccent} font-semibold transition-colors`}>AI Assistant</span> that ensures your GitHub contribution graph never goes gray.</>
              ) : sessionUser ? (
                <>Hi {sessionUser.user_metadata?.user_name}, I am your <span className={`${theme.subHeadingAccent} font-semibold transition-colors`}>AI Assistant</span> that ensures your GitHub contribution graph never goes gray.</>
              ) : (
                <>The <span className={`${theme.subHeadingAccent} font-semibold transition-colors`}>AI Assistant</span> that ensures your GitHub contribution graph never goes gray.</>
              )}
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
              <>
                <Link href="/dashboard" className={`h-14 px-8 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center ${theme.buttonPrimary}`}>
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="h-14 px-6 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 w-full sm:w-auto justify-center"
                >
                  <LogOut size={18} /> <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleLogin('github')}
                  disabled={!!loading}
                  data-tutorial="signup-github"
                  className={`h-14 px-8 rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center ${theme.buttonPrimary}`}
                >
                  <Github size={20} />
                  <span>Sign up with GitHub</span>
                </button>
                {/* Google Login Removed */}
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

      {/* Tutorial Modal */}
      {activeModal === 'tutorial' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <BookOpen size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">How to Use GitMaxer</h2>
                  <p className="text-sm text-gray-400">Quick start guide</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Start Interactive Tour Button */}
              <button
                onClick={() => {
                  setActiveModal(null)
                  setTimeout(() => startTutorial(), 300)
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/30"
              >
                <span className="text-2xl">🚀</span>
                <span>Start Interactive Tour</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative bg-gray-900 px-4 text-sm text-gray-500">or read the guide below</div>
              </div>

              {/* Important Notice */}
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4">
                <p className="text-sm text-red-300 text-center font-medium">
                  ⚠️ You MUST sign up with GitHub first. Google login is only for returning users!
                </p>
              </div>

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/20">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Sign up with GitHub (Required)</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Click <span className="text-white font-semibold">"Sign up with GitHub"</span> to create your account. This is mandatory because we need access to your GitHub repositories to create commits on your behalf.
                  </p>
                  <p className="text-gray-500 text-xs mt-2 italic">
                    💡 Google login is only for users who have already signed up with GitHub.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Complete Your Setup</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    After signing in, you'll be taken to the setup page where you can:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-400">
                    <li>• Choose your contribution repository (new or existing)</li>
                    <li>• Set your preferred commit time (we recommend matching your timezone)</li>
                    <li>• Customize commit messages (Pro feature)</li>
                    <li>• Select contribution intensity (1-5 commits/day)</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/20">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Sit Back & Watch the Magic</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Once configured, GitMaxer runs automatically every day at your chosen time. You'll see your contribution graph fill up with beautiful green squares! 🟩🟩🟩
                  </p>
                </div>
              </div>

              {/* Step 4 - Dashboard */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/20">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">Monitor Your Dashboard</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Visit your dashboard anytime to see your streak status, recent commits, and settings. You can pause, resume, or modify your contribution schedule at any time.
                  </p>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5 mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-amber-400" />
                  <h4 className="text-amber-400 font-semibold">Pro Tips</h4>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Use a <strong>private repository</strong> if you want to keep your automated commits hidden from others</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Set contribution time to match your <strong>timezone</strong> for natural-looking activity patterns</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Upgrade to <strong>Pro</strong> for custom commit messages, LeetCode integration, and priority support!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>Your streak data syncs in real-time with GitHub - no delays!</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* About Us Modal */}
      {activeModal === 'about' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative h-32 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
              <div className="absolute inset-0 bg-black/20" />
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all backdrop-blur-sm"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Profile */}
            <div className="relative px-6 pb-6">
              <div className="absolute -top-12 left-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-gray-900 shadow-xl overflow-hidden">
                  <img src="/logo.jpg" alt="Rishit Tandon" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="pt-14">
                <h2 className="text-2xl font-bold text-white">Rishit Tandon</h2>
                <p className="text-gray-400 text-sm">Creator & Developer</p>

                <p className="mt-4 text-gray-300 text-sm leading-relaxed">
                  Hey! I'm Rishit, a passionate developer who loves building tools that make developers' lives easier.
                  GitMaxer was born out of a simple idea: why should your contribution streak die just because you took a break?
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href="https://github.com/rishittandon7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white transition-all"
                  >
                    <Github size={16} />
                    <span>GitHub</span>
                  </a>
                  <a
                    href="https://instagram.com/kingrishit2.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border border-pink-500/30 rounded-full text-sm text-white transition-all"
                  >
                    <span>📸</span>
                    <span>@kingrishit2.0</span>
                  </a>
                  <a
                    href="mailto:rishittandon7@gmail.com"
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white transition-all"
                  >
                    <Mail size={16} />
                    <span>Email</span>
                  </a>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm text-green-300 text-center">
                    💚 Thank you for using GitMaxer! Your support means everything.
                  </p>
                </div>

                {/* GitMaxer Community */}
                <a
                  href="https://chat.whatsapp.com/LDdiCn2GGf9EI4KvlZ5e4i"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 border border-green-500/30 rounded-xl transition-all group"
                >
                  <span className="text-2xl">💬</span>
                  <div className="text-left">
                    <p className="text-white font-semibold text-sm group-hover:text-green-300 transition-colors">Join GitMaxer Community</p>
                    <p className="text-gray-400 text-xs">Connect with other users & get support</p>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Other Projects Modal */}
      {activeModal === 'projects' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <FolderGit2 size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Other Projects</h2>
                  <p className="text-sm text-gray-400">More by Rishit Tandon</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Projects Grid */}
            <div className="p-6 grid gap-4">
              {/* Project 1 - LinkedOut Pro */}
              <a
                href="https://linkedout-pro.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl hover:border-blue-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                      LinkedOut Pro
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Professional LinkedIn profile optimization and networking tool
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl">💼</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">LinkedIn</span>
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">Networking</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Live ✓</span>
                </div>
              </a>

              {/* Project 2 - GeoTag Pro */}
              <a
                href="https://regal-puppy-f9382d.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl hover:border-green-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">
                      GeoTag Pro
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Advanced geolocation tagging and mapping solution
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">📍</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Maps</span>
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full">Location</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Live ✓</span>
                </div>
              </a>

              {/* Project 3 - GitMaxer */}
              <a
                href="https://git-maxer.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl hover:border-purple-500/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors">
                      GitMaxer (This App!)
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Keep your GitHub contribution streak alive forever with AI automation
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">🟩</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">GitHub</span>
                  <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full">Automation</span>
                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Live ✓</span>
                </div>
              </a>

              {/* View More on GitHub */}
              <a
                href="https://github.com/rishittandon7?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-white font-medium"
              >
                <Github size={18} />
                <span>View all projects on GitHub</span>
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
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

function LeetCodeTheme() {
  return (
    <div className="absolute inset-0 bg-[#050505] overflow-hidden">
      {/* Subtle purple gradient at top */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/15 via-[#050505] to-[#050505]" />

      {/* Purple floating particles */}
      {[...Array(150)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          initial={{
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5
          }}
          animate={{
            y: [Math.random() * 800, Math.random() * -200],
            opacity: [0, Math.random() * 0.8 + 0.3, 0],
          }}
          transition={{
            duration: Math.random() * 6 + 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "linear"
          }}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: Math.random() * 5 + 3 + 'px',
            height: Math.random() * 5 + 3 + 'px',
            backgroundColor: '#a855f7',
            boxShadow: '0 0 12px rgba(168, 85, 247, 0.8)'
          }}
        />
      ))}
    </div>
  )
}

