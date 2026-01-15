'use client'

import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OwnerStats() {
    const router = useRouter()

    return (
        <motion.button
            onClick={() => router.push('/admin')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-red-600 to-orange-600 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center justify-center border-2 border-white/10 text-white cursor-pointer group"
        >
            <Crown className="w-6 h-6 group-hover:animate-pulse" />
            <span className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border border-black animate-ping" />
        </motion.button>
    )
}
