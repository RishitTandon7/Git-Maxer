'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Github, ArrowRight, Mail, Terminal, Cpu, ShieldCheck, Activity } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null)
  const [count, setCount] = useState(0)

  // Animated Counter for "Contributions Generated"
  useEffect(() => {
    const controls = animate(0, 12453, {
      duration: 3,
      onUpdate: (value) => setCount(Math.floor(value))
    })
    return controls.stop
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
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">
              <Terminal size={18} strokeWidth={3} />
            </div>
            GitMaxer
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <button
              onClick={() => handleLogin('github')}
              className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Get Started
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
              <button
                onClick={() => handleLogin('github')}
                disabled={!!loading}
                className="h-12 px-8 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <Github size={20} />
                {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
              </button>
              <button
                onClick={() => handleLogin('google')}
                disabled={!!loading}
                className="h-12 px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
              >
                <Mail size={20} />
                {loading === 'google' ? 'Connecting...' : 'Google'}
              </button>
            </motion.div>
          </div>

          {/* Bento Grid Features */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Card 1: AI Tech (Promoted to Hero Card) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
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

            {/* Card 2: Security */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
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

          {/* Pricing Section */}
          <div id="pricing" className="space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-bold tracking-tighter">Simple Pricing</h2>
              <p className="text-gray-400 text-lg">Start free, upgrade when you need more.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Free Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold mb-2">Free</h3>
                  <div className="text-4xl font-bold mb-1">$0</div>
                  <p className="text-gray-400 text-sm">Forever free</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> 1 Repository
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Daily Auto-commits
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> AI Code Generation
                  </li>
                </ul>
                <button className="w-full py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors">
                  Current Plan
                </button>
              </motion.div>

              {/* Pro Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-b from-blue-500/10 to-[#0A0A0A] border border-blue-500/20 rounded-3xl p-8 space-y-6 relative"
              >
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400">
                  Popular
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Pro</h3>
                  <div className="text-4xl font-bold mb-1">$9</div>
                  <p className="text-gray-400 text-sm">per month</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Unlimited Repositories
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Custom Schedules
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Priority Support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Analytics Dashboard
                  </li>
                </ul>
                <button className="w-full py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors">
                  Upgrade to Pro
                </button>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold mb-1">Custom</div>
                  <p className="text-gray-400 text-sm">For teams</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Everything in Pro
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Team Management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> SSO & SAML
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span> Dedicated Support
                  </li>
                </ul>
                <button className="w-full py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors">
                  Contact Sales
                </button>
              </motion.div>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm">
        <p>© 2024 GitMaxer. All rights reserved.</p>
      </footer>
    </div>
  )
}
