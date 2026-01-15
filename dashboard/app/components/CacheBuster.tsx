'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// This version is updated with each deployment
const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'

export function CacheBuster() {
    useEffect(() => {
        // Auto-clear corrupted auth sessions
        const clearCorruptedAuth = async () => {
            try {
                const { error } = await supabase.auth.getSession()
                if (error && (error.message.includes('refresh_token') || error.message.includes('Invalid'))) {
                    console.warn('🧹 Clearing corrupted auth session...')
                    await supabase.auth.signOut()
                    localStorage.clear()
                    sessionStorage.clear()
                    // Only reload once
                    if (!sessionStorage.getItem('auth_cleared')) {
                        sessionStorage.setItem('auth_cleared', 'true')
                        window.location.reload()
                    }
                }
            } catch (e) {
                // Silently handle
            }
        }
        clearCorruptedAuth()

        // Check if we have a stored version
        const storedVersion = localStorage.getItem('app_version')

        if (storedVersion && storedVersion !== APP_VERSION && APP_VERSION !== 'dev') {
            console.log(`🔄 Version mismatch: ${storedVersion} → ${APP_VERSION}. Clearing cache...`)

            // Clear all caches
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name)
                    })
                })
            }

            // Update stored version before reload
            localStorage.setItem('app_version', APP_VERSION)

            // Force reload from server
            window.location.reload()
        } else if (!storedVersion || storedVersion !== APP_VERSION) {
            // First visit or version updated, just store it
            localStorage.setItem('app_version', APP_VERSION)
        }
    }, [])

    return null
}
