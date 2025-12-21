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
        // Check active session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    setUser(session.user)

                    // INSTANT Owner check (no DB delay)
                    if (session.user.user_metadata?.user_name === 'rishittandon7') {
                        setUserPlan('owner')
                        console.log('🎯 Auth: Detected OWNER via metadata')
                    }

                    // Background fetch from DB
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('plan_type')
                        .eq('user_id', session.user.id)
                        .single()

                    if (settings?.plan_type) {
                        // Owner always stays owner
                        if (session.user.user_metadata?.user_name === 'rishittandon7') {
                            setUserPlan('owner')
                        } else {
                            setUserPlan(settings.plan_type as PlanType)
                            console.log('🎯 Auth: Plan from DB:', settings.plan_type)
                        }
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
            } finally {
                setLoading(false)
            }
        }

        initializeAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🎯 Auth event:', event)

            if (session?.user) {
                setUser(session.user)

                // Instant owner check
                if (session.user.user_metadata?.user_name === 'rishittandon7') {
                    setUserPlan('owner')
                } else {
                    // Fetch plan for non-owners
                    const { data: settings } = await supabase
                        .from('user_settings')
                        .select('plan_type')
                        .eq('user_id', session.user.id)
                        .single()

                    if (settings?.plan_type) {
                        setUserPlan(settings.plan_type as PlanType)
                    }
                }
            } else {
                setUser(null)
                setUserPlan(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setUserPlan(null)
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
