'use client'

import { motion } from 'framer-motion'
import { Terminal } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'
import { useState, useEffect } from 'react'

export default function PricingPage() {
    const [loading, setLoading] = useState(false)
    const [stars, setStars] = useState<any[]>([])

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

    const handlePayment = async () => {
        setLoading(true)
        try {
            // 1. Create Order
            const res = await fetch('/api/razorpay/order', { method: 'POST' })

            // Check content type to avoid "Unexpected token <" error if 404 HTML is returned
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`API Error: Backend not found. Response: ${text.slice(0, 50)}...`);
            }

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to create order')

            // 2. Initialize Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
                amount: data.amount,
                currency: data.currency,
                name: "GitMaxer Pro",
                description: "Upgrade to GitMaxer Pro",
                order_id: data.id,
                handler: async function (response: any) {
                    // 3. Verify Payment
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        }),
                    })
                    const verifyData = await verifyRes.json()

                    if (verifyData.success) {
                        alert("Payment successful! Welcome to Pro.")
                        window.location.href = '/dashboard'
                    } else {
                        alert("Payment verification failed.")
                    }
                },
                prefill: {
                    email: "user@example.com", // We should fetch this from auth if possible
                },
                theme: {
                    color: "#3B82F6",
                },
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

            {/* Interactive Star Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]" />
                {stars.map((star, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        initial={{
                            x: star.x,
                            y: star.y,
                            opacity: star.opacity,
                            scale: star.scale
                        }}
                        animate={{
                            y: [null, Math.random() * -100],
                            opacity: [null, 0]
                        }}
                        transition={{
                            duration: star.duration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        style={{
                            width: star.width,
                            height: star.height,
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
                        <Link href="/pricing" className="text-sm text-white font-semibold transition-colors">Pricing</Link>
                        <Link href="/" className="bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto space-y-16">

                    {/* Header */}
                    <div className="text-center space-y-6">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-6xl md:text-7xl font-bold tracking-tighter"
                        >
                            Simple Pricing
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto"
                        >
                            Start free, upgrade when you need more.
                        </motion.p>
                    </div>

                    {/* Pricing Cards */}
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
                                <div className="text-4xl font-bold mb-1">₹30</div>
                                <p className="text-gray-400 text-sm">One time</p>
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
                            <button
                                onClick={handlePayment}
                                disabled={loading}
                                className="w-full py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Upgrade to Pro"}
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
            </main>

            <footer className="border-t border-white/5 py-12 text-center text-gray-500 text-sm relative z-10">
                <p>© 2024 GitMaxer. All rights reserved.</p>
            </footer>
        </div>
    )
}
