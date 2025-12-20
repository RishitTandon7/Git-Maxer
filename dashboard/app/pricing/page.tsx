'use client'

import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PricingPage() {
    const [loading, setLoading] = useState(false)
    const [stars, setStars] = useState<any[]>([])
    const [sessionUser, setSessionUser] = useState<any>(null)
    const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'enterprise' | 'owner' | null>(null)

    useEffect(() => {
        // Check Session & Owner status
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setSessionUser(session.user)
                // Instant Owner Check
                if (session.user.user_metadata?.user_name === 'rishittandon7') {
                    setUserPlan('owner')
                }

                const { data: settings } = await supabase
                    .from('user_settings')
                    .select('plan_type')
                    .eq('user_id', session.user.id)
                    .single()

                if (settings?.plan_type && session.user.user_metadata?.user_name !== 'rishittandon7') {
                    setUserPlan(settings.plan_type as any)
                }
            }
        }
        checkSession()

        // Generate stars only on client side to avoid hydration mismatch
        const newStars = [...Array(50)].map(() => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: Math.random() * 0.5 + 0.3,
            scale: Math.random() * 0.5 + 0.5,
            duration: Math.random() * 10 + 10,
            width: Math.random() * 2 + 1 + 'px',
            height: Math.random() * 2 + 1 + 'px',
        }))
        setStars(newStars)
    }, [])

    const handlePayment = async (plan: 'pro' | 'enterprise', amount: number) => {
        setLoading(true)
        try {
            // 1. Create Order
            const res = await fetch('/api/razorpay/order', {
                method: 'POST',
                body: JSON.stringify({ amount, plan }), // Send plan type
            })

            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`API Error: Backend not found.`);
            }

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create order')

            // 2. Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: `GitMaxer ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
                description: `Upgrade to ${plan}`,
                order_id: data.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                            plan: plan // Pass plan type to activate correct tier
                        }),
                    })
                    const verifyData = await verifyRes.json()

                    if (verifyData.success) {
                        alert(`Welcome to ${plan.toUpperCase()}!`)
                        window.location.href = '/dashboard'
                    } else {
                        alert("Payment verification failed.")
                    }
                },
                theme: { color: "#3B82F6" },
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error: any) {
            console.error("Payment Error:", error)
            alert(`Payment failed: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 overflow-x-hidden relative">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" />

            {/* Background Stars (Client Only) */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
                {stars.map((star, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        initial={{ x: star.x, y: star.y, opacity: star.opacity, scale: star.scale }}
                        animate={{ y: [null, Math.random() * -100], opacity: [null, 0] }}
                        transition={{ duration: star.duration, repeat: Infinity, ease: "linear" }}
                        style={{ width: star.width, height: star.height }}
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
                        <Link href="/pricing" className="text-sm text-white font-semibold transition-colors">Pricing</Link>
                        {sessionUser ? (
                            <Link
                                href="/dashboard"
                                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-lg flex items-center gap-2
                                     ${userPlan === 'owner' ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-amber-500/50' :
                                        userPlan === 'enterprise' ? 'bg-green-500 text-black hover:bg-green-400 shadow-green-500/20' :
                                            userPlan === 'pro' ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/30' :
                                                'bg-white text-black hover:bg-gray-200'}
                                   `}
                            >
                                {userPlan === 'owner' ? '👑 Dashboard' : 'View Dashboard'}
                            </Link>
                        ) : (
                            <Link href="/" className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">Login</Link>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto space-y-16">

                    {/* Header */}
                    <div className="text-center space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="text-5xl md:text-7xl font-bold tracking-tighter"
                        >
                            Plans for Everyone
                        </motion.h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Choose the pace of your growth.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">

                        {/* Free Plan */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 space-y-6 hover:border-white/20 transition-colors">
                            <div>
                                <h3 className="text-xl font-bold mb-2">Free</h3>
                                <div className="text-4xl font-bold mb-1">₹0</div>
                                <p className="text-gray-400 text-sm">Forever free</p>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-300">
                                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 1 Repository Limit</li>
                                <li className="flex items-center gap-2"><span className="text-yellow-400">⚠</span> 1 Commit per Week</li>
                                <li className="flex items-center gap-2"><span className="text-gray-500">✗</span> No Custom Badge</li>
                            </ul>
                            <button className="w-full py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors cursor-not-allowed opacity-50">
                                Current Plan
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className="bg-gradient-to-b from-yellow-500/10 to-[#0A0A0A] border border-yellow-500/30 rounded-3xl p-8 space-y-6 relative hover:scale-105 transition-transform duration-300">
                            <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-400">Best Value</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-yellow-500">Pro</h3>
                                <div className="text-4xl font-bold mb-1">₹30</div>
                                <p className="text-gray-400 text-sm">Per Month</p>
                            </div>
                            <ul className="space-y-3 text-sm text-white">
                                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> <b>3 Commits per Day</b></li>
                                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited Repositories</li>
                                <li className="flex items-center gap-2"><span className="text-yellow-400">★</span> <b>Gold Pro Badge</b></li>
                                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Custom Login Screen</li>
                            </ul>
                            <button
                                onClick={() => handlePayment('pro', 3000)}
                                disabled={loading}
                                className="w-full py-3 rounded-full bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
                            >
                                {loading ? "Processing..." : "Upgrade to Pro"}
                            </button>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="bg-gradient-to-b from-blue-600/10 to-[#0A0A0A] border border-blue-600/30 rounded-3xl p-8 space-y-6 hover:border-blue-500 transition-colors">
                            <div>
                                <h3 className="text-xl font-bold mb-2 text-blue-500">Enterprise</h3>
                                <div className="text-4xl font-bold mb-1">₹90</div>
                                <p className="text-gray-400 text-sm">Per Month</p>
                            </div>
                            <ul className="space-y-3 text-sm text-white">
                                <li className="flex items-center gap-2"><span className="text-purple-400">⚡</span> <b>Project Mode (15 Days)</b></li>
                                <li className="flex items-center gap-2">Give a prompt → Bot finishes it</li>
                                <li className="flex items-center gap-2"><span className="text-blue-400">★</span> <b>Enterprise Badge</b></li>
                                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All Pro Features</li>
                            </ul>
                            <button
                                onClick={() => handlePayment('enterprise', 9000)}
                                disabled={loading}
                                className="w-full py-3 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                            >
                                {loading ? "Processing..." : "Get Enterprise"}
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}
