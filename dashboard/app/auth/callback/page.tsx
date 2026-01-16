'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState('Processing authentication...')

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // Check if we have hash fragment with tokens (implicit flow)
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    setStatus('Exchanging tokens...')

                    // Supabase will automatically pick up the hash fragment
                    const { data: { session }, error } = await supabase.auth.getSession()

                    if (error) {
                        console.error('Auth error:', error)
                        setStatus(`Error: ${error.message}`)
                        setTimeout(() => router.push('/'), 3000)
                        return
                    }

                    if (session) {
                        setStatus('Session established! Redirecting...')

                        // Store the provider token if available
                        const providerToken = session.provider_token
                        if (providerToken && session.user) {
                            // Call API to store the token
                            try {
                                await fetch('/api/auth/store-token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userId: session.user.id,
                                        providerToken,
                                        username: session.user.user_metadata?.user_name
                                    })
                                })
                            } catch (e) {
                                console.error('Failed to store token:', e)
                            }
                        }

                        // Check if user has settings
                        const { data: settings } = await supabase
                            .from('user_settings')
                            .select('id')
                            .eq('id', session.user.id)
                            .single()

                        if (settings) {
                            router.push('/dashboard')
                        } else {
                            router.push('/setup')
                        }
                        return
                    }
                }

                // Check for code parameter (PKCE flow)
                const params = new URLSearchParams(window.location.search)
                const code = params.get('code')
                if (code) {
                    setStatus('Exchanging authorization code...')

                    // Exchange code for session
                    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

                    if (error) {
                        console.error('Code exchange error:', error)
                        setStatus(`Error: ${error.message}`)
                        setTimeout(() => router.push('/'), 3000)
                        return
                    }

                    if (session) {
                        setStatus('Session established! Redirecting...')

                        // Store the provider token if available
                        const providerToken = session.provider_token
                        if (providerToken && session.user) {
                            try {
                                await fetch('/api/auth/store-token', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userId: session.user.id,
                                        providerToken,
                                        username: session.user.user_metadata?.user_name
                                    })
                                })
                            } catch (e) {
                                console.error('Failed to store token:', e)
                            }
                        }

                        // Check if user has settings
                        const { data: settings } = await supabase
                            .from('user_settings')
                            .select('id')
                            .eq('id', session.user.id)
                            .single()

                        if (settings) {
                            router.push('/dashboard')
                        } else {
                            router.push('/setup')
                        }
                        return
                    }
                }

                // No auth params found
                setStatus('No authentication data found. Redirecting...')
                setTimeout(() => router.push('/'), 2000)

            } catch (err) {
                console.error('Auth callback error:', err)
                setStatus('Authentication failed. Redirecting...')
                setTimeout(() => router.push('/'), 3000)
            }
        }

        handleAuth()
    }, [router])

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-lg">{status}</p>
            </div>
        </div>
    )
}
