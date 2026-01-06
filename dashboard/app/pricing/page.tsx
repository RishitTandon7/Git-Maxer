'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Terminal } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { useState, useEffect } from 'react'
import { useAuth } from '../providers/AuthProvider'

export default function PricingPage() {
    const [loading, setLoading] = useState(false)
    const [stars, setStars] = useState<any[]>([])
    const [showModal, setShowModal] = useState(false)
    const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'info' as 'success' | 'error' | 'info' })

    // Use centralized auth
    const { user: sessionUser, userPlan } = useAuth()

    useEffect(() => {
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
        // SECURITY: Check if user is logged in
        if (!sessionUser) {
            setModalContent({
                title: 'Login Required',
                message: 'Please login first to upgrade your plan and start your journey!',
                type: 'info'
            })
            setShowModal(true)
            setTimeout(() => {
                window.location.href = '/'
            }, 2000)
            return
        }

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
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', // Razorpay Key ID from env
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
                        setModalContent({
                            title: '🎉 Welcome to ' + plan.toUpperCase() + '!',
                            message: 'Your account has been upgraded successfully! Redirecting to dashboard...',
                            type: 'success'
                        })
                        setShowModal(true)
                        setTimeout(() => {
                            window.location.href = '/dashboard'
                        }, 2000)
                    } else {
                        setModalContent({
                            title: 'Payment Failed',
                            message: 'Payment verification failed. Please contact support if amount was deducted.',
                            type: 'error'
                        })
                        setShowModal(true)
                    }
                },
                prefill: {
                    name: sessionUser?.user_metadata?.user_name || '',
                    email: sessionUser?.email || '',
                },
                theme: {
                    color: plan === 'pro' ? '#EAB308' : '#3B82F6',
                    backdrop_color: 'rgba(0, 0, 0, 0.8)'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (error: any) {
            console.error("Payment Error:", error)
            setModalContent({
                title: 'Payment Error',
                message: error.message || 'Failed to process payment. Please try again.',
                type: 'error'
            })
            setShowModal(true)
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
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-b from-blue-500/10 to-[#0A0A0A] border border-blue-500/30 rounded-3xl p-8 space-y-6 relative"
                            style={{
                                boxShadow: '0 0 40px rgba(59, 130, 246, 0.2), 0 0 80px rgba(59, 130, 246, 0.1)',
                            }}
                        >
                            {/* Animated Glow Effect */}
                            <motion.div
                                className="absolute inset-0 rounded-3xl"
                                style={{
                                    background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), transparent 70%)',
                                }}
                                animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            {userPlan === 'pro' || userPlan === 'owner' ? (
                                <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-xs text-green-400 font-bold z-10">
                                    ✓ {userPlan === 'owner' ? 'Included' : 'Current Plan'}
                                </div>
                            ) : (
                                <motion.div
                                    animate={{
                                        boxShadow: [
                                            '0 0 10px rgba(59, 130, 246, 0.3)',
                                            '0 0 20px rgba(59, 130, 246, 0.6)',
                                            '0 0 10px rgba(59, 130, 246, 0.3)',
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-4 right-4 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 z-10"
                                >
                                    ⭐ Best Value
                                </motion.div>
                            )}
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2 text-blue-400">⭐ Pro</h3>
                                <div className="text-5xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-400 to-blue-500">₹30</div>
                                <p className="text-blue-400/70 text-sm font-medium">Per Month</p>
                            </div>
                            <ul className="space-y-3 text-sm text-blue-50 relative z-10">
                                <li className="flex items-center gap-2"><span className="text-blue-400 text-lg">✓</span> <b className="text-blue-200">1 Commit, 1 Repo Daily</b></li>
                                <li className="flex items-center gap-2"><span className="text-blue-400 text-lg">✓</span> <span className="text-blue-100">Unlimited Repositories</span></li>
                                <li className="flex items-center gap-2"><span className="text-sky-400 text-lg">★</span> <b className="text-blue-200">Pro Badge</b></li>
                                <li className="flex items-center gap-2"><span className="text-blue-400 text-lg">✓</span> <span className="text-blue-100">Custom Login Screen</span></li>
                                <li className="flex items-center gap-2"><span className="text-green-400 text-lg">🎯</span> <b className="text-green-200">365 Contributions at Year End*</b></li>
                            </ul>
                            <p className="text-[10px] text-gray-500 italic relative z-10 mt-2">
                                *if you buy it for all 12 months
                            </p>
                            <button
                                onClick={() => handlePayment('pro', 3000)}
                                disabled={loading || userPlan === 'pro' || userPlan === 'owner'}
                                className={`w-full py-3 rounded-full font-bold transition-colors ${userPlan === 'pro' || userPlan === 'owner'
                                    ? 'bg-yellow-500/30 text-yellow-500 border border-yellow-500/50 cursor-not-allowed'
                                    : 'bg-yellow-500 text-black hover:bg-yellow-400'
                                    }`}
                            >
                                {loading ? "Processing..." :
                                    userPlan === 'pro' ? "✓ Current Plan" :
                                        userPlan === 'owner' ? "👑 Included in Owner" :
                                            sessionUser ? "Upgrade to Pro" : "🔒 Login to Upgrade"}
                            </button>
                        </motion.div>

                        {/* Enterprise Plan - Golden Theme */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            className="bg-gradient-to-b from-amber-600/10 to-[#0A0A0A] border border-amber-500/30 rounded-3xl p-8 space-y-6 relative overflow-hidden"
                            style={{
                                boxShadow: '0 0 40px rgba(245, 158, 11, 0.2), 0 0 80px rgba(245, 158, 11, 0.1)',
                            }}
                        >
                            {/* Animated Shimmer Effect */}
                            <motion.div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(45deg, transparent 30%, rgba(245, 158, 11, 0.1) 50%, transparent 70%)',
                                    backgroundSize: '200% 200%',
                                }}
                                animate={{
                                    backgroundPosition: ['0% 0%', '100% 100%'],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            />

                            {/* Floating Particles */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-amber-400 rounded-full"
                                    style={{
                                        left: `${20 + i * 15}%`,
                                        bottom: 0,
                                    }}
                                    animate={{
                                        y: [-20, -200],
                                        opacity: [0, 1, 0],
                                        scale: [1, 1.5, 1],
                                    }}
                                    transition={{
                                        duration: 3 + i * 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.4,
                                        ease: "easeOut"
                                    }}
                                />
                            ))}

                            {userPlan === 'enterprise' || userPlan === 'owner' ? (
                                <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-xs text-green-400 font-bold z-10">
                                    ✓ {userPlan === 'owner' ? 'Included' : 'Current Plan'}
                                </div>
                            ) : (
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        opacity: [0.7, 1, 0.7],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-4 right-4 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-xs text-amber-400 font-bold z-10"
                                >
                                    💼 Premium
                                </motion.div>
                            )}
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600">💼 Enterprise</h3>
                                <div className="text-5xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 relative z-10">₹90</div>
                                <p className="text-amber-500/60 text-sm font-medium relative z-10">Per Month</p>
                            </div>
                            <ul className="space-y-3 text-sm text-gray-300 relative z-10">
                                <li className="flex items-center gap-2"><span className="text-amber-400 text-lg">⚡</span> <b className="text-white">Project Mode (15 Days)</b></li>
                                <li className="flex items-center gap-2"><span className="text-yellow-400 text-lg">→</span> <span className="text-gray-300">Give a prompt → Bot finishes it</span></li>
                                <li className="flex items-center gap-2"><span className="text-amber-400 text-lg">★</span> <b className="text-amber-200">Enterprise Badge</b></li>
                                <li className="flex items-center gap-2"><span className="text-yellow-400 text-lg">✓</span> <span className="text-gray-300">All Pro Features</span></li>
                            </ul>
                            <button
                                onClick={() => handlePayment('enterprise', 9000)}
                                disabled={loading || userPlan === 'enterprise' || userPlan === 'owner'}
                                className={`w-full py-3 rounded-full font-bold transition-colors relative z-10 ${userPlan === 'enterprise' || userPlan === 'owner'
                                    ? 'bg-amber-600/30 text-amber-500 border border-amber-500/50 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:shadow-lg hover:shadow-amber-500/30'
                                    }`}
                            >
                                {loading ? "Processing..." :
                                    userPlan === 'enterprise' ? "✓ Current Plan" :
                                        userPlan === 'owner' ? "👑 Included in Owner" :
                                            sessionUser ? "Get Enterprise" : "🔒 Login to Upgrade"}
                            </button>
                        </motion.div>

                    </div>
                </div>
            </main >

            {/* Custom Modal */}
            <AnimatePresence>
                {
                    showModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setShowModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className={`relative max-w-md w-full bg-gradient-to-br ${modalContent.type === 'success' ? 'from-green-500/20 to-emerald-500/10' :
                                    modalContent.type === 'error' ? 'from-red-500/20 to-rose-500/10' :
                                        'from-blue-500/20 to-cyan-500/10'
                                    } backdrop-blur-xl border ${modalContent.type === 'success' ? 'border-green-500/30' :
                                        modalContent.type === 'error' ? 'border-red-500/30' :
                                            'border-blue-500/30'
                                    } rounded-2xl p-8 shadow-2xl`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Icon */}
                                <div className="flex justify-center mb-6 relative">
                                    {modalContent.type === 'success' && (
                                        <>
                                            {/* Confetti particles */}
                                            {[...Array(20)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
                                                    animate={{
                                                        y: [0, -100, -200],
                                                        x: [(i % 2 === 0 ? 1 : -1) * (Math.random() * 100 + 50)],
                                                        opacity: [1, 1, 0],
                                                        scale: [0, 1, 0.5],
                                                        rotate: Math.random() * 720
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        delay: i * 0.05,
                                                        repeat: Infinity,
                                                        repeatDelay: 1
                                                    }}
                                                    className="absolute w-2 h-2 rounded-full"
                                                    style={{
                                                        background: ['#EAB308', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 5]
                                                    }}
                                                />
                                            ))}

                                            {/* Animated Crown/Star */}
                                            <motion.div
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{
                                                    scale: [0, 1.2, 1],
                                                    rotate: [- 180, 0, 360, 0],
                                                }}
                                                transition={{
                                                    duration: 1,
                                                    times: [0, 0.6, 1]
                                                }}
                                                className="relative"
                                            >
                                                {/* Glow effect */}
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.3, 1],
                                                        opacity: [0.5, 0.8, 0.5]
                                                    }}
                                                    transition={{
                                                        duration: 2,
                                                        repeat: Infinity
                                                    }}
                                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 blur-xl"
                                                />

                                                {/* Crown emoji */}
                                                <div className="relative w-24 h-24 flex items-center justify-center text-6xl">
                                                    👑
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                    {modalContent.type === 'error' && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: 360 }}
                                            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                                            className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center"
                                        >
                                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.div>
                                    )}
                                    {modalContent.type === 'info' && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: 360 }}
                                            transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
                                            className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center"
                                        >
                                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7m0 0V5m0 2h2m-2 0H10" />
                                            </svg>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold text-center mb-3 text-white"
                                >
                                    {modalContent.title}
                                </motion.h2>

                                {/* Message */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-center text-gray-300 mb-8"
                                >
                                    {modalContent.message}
                                </motion.p>

                                {/* Close Button */}
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    onClick={() => setShowModal(false)}
                                    className={`w-full py-3 rounded-full font-bold transition-all ${modalContent.type === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                                        modalContent.type === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                                            'bg-blue-500 hover:bg-blue-600 text-white'
                                        }`}
                                >
                                    {modalContent.type === 'success' ? '🎉 Awesome!' : modalContent.type === 'error' ? 'Try Again' : 'Got it!'}
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    )
}
