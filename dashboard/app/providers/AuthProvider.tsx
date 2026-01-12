'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type PlanType = 'free' | 'pro' | 'enterprise' | 'owner' | null

interface AuthContextType {
    user: User | null
    userPlan: PlanType
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userPlan, setUserPlan] = useState<PlanType>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // FAIL-SAFE: Force loading off after 3 seconds no matter what
        const failsafeTimeout = setTimeout(() => {
            if (loading) {
                console.warn('⚠️ AuthProvider timeout - forcing loading off')
                setLoading(false)
            }
        }, 3000)

        // Check active session
        const initializeAuth = async () => {
            try {
                console.log('🔄 AuthProvider: Initializing...')
                const { data: { session }, error } = await supabase.auth.getSession()

                if (error) {
                    console.error('❌ AuthProvider: getSession error:', error)
                    setLoading(false)
                    return
                }

                if (session?.user) {
                    console.log('✅ AuthProvider: Session found for', session.user.email)
                    setUser(session.user)

                    // INSTANT Owner check (no DB delay)
                    if (session.user.user_metadata?.user_name === 'rishittandon7') {
                        setUserPlan('owner')
                        console.log('🎯 Auth: Detected OWNER via metadata')
                    }

                    // Check localStorage cache first for instant loading
                    const cachedPlan = localStorage.getItem('userPlan')
                    if (cachedPlan) {
                        setUserPlan(cachedPlan as PlanType)
                        console.log('🎯 Auth: Using cached plan:', cachedPlan)
                    }

                    // Background fetch from DB to update cache
                    try {
                        const { data: settings } = await supabase
                            .from('user_settings')
                            .select('plan_type')
                            .eq('id', session.user.id)
                            .single()

                        if (settings?.plan_type) {
                            // Owner always stays owner
                            if (session.user.user_metadata?.user_name === 'rishittandon7') {
                                setUserPlan('owner')
                                localStorage.setItem('userPlan', 'owner')
                            } else {
                                setUserPlan(settings.plan_type as PlanType)
                                localStorage.setItem('userPlan', settings.plan_type)
                                console.log('🎯 Auth: Plan from DB:', settings.plan_type)
                            }
                        }
                    } catch (dbError) {
                        console.error('DB fetch error:', dbError)
                    }
                } else {
                    console.log('ℹ️ AuthProvider: No session found')
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                setLoading(false)
                clearTimeout(failsafeTimeout)
            }
        }

        initializeAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🎯 Auth event:', event)

            if (session?.user) {
                setUser(session.user)

                // Check cache first
                const cachedPlan = localStorage.getItem('userPlan')
                if (cachedPlan) {
                    setUserPlan(cachedPlan as PlanType)
                }

                // Instant owner check
                if (session.user.user_metadata?.user_name === 'rishittandon7') {
                    setUserPlan('owner')
                    localStorage.setItem('userPlan', 'owner')
                } else {
                    // Fetch plan for non-owners
                    try {
                        const { data: settings } = await supabase
                            .from('user_settings')
                            .select('plan_type')
                            .eq('id', session.user.id)
                            .single()

                        if (settings?.plan_type) {
                            setUserPlan(settings.plan_type as PlanType)
                            localStorage.setItem('userPlan', settings.plan_type)
                        }
                    } catch (err) {
                        console.error('Error fetching plan:', err)
                    }
                }
            } else {
                setUser(null)
                setUserPlan(null)
                localStorage.removeItem('userPlan') // Clear cache on logout
            }
        })

        return () => {
            clearTimeout(failsafeTimeout)
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setUserPlan(null)
        localStorage.removeItem('userPlan') // Clear cached plan
        window.location.href = '/' // Force full page reload to clear all state
    }

    return (
        <AuthContext.Provider value={{ user, userPlan, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
