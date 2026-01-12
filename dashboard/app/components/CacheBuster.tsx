'use client'

import { useEffect } from 'react'

// This version is updated with each deployment
const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_ID || 'dev'

export function CacheBuster() {
    useEffect(() => {
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
