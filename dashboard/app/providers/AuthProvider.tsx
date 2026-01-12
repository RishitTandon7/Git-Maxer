'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

type PlanType = 'free' | 'pro' | 'enterprise' | 'owner' | 'leetcode' | null

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

    const fetchUserPlan = async (userId: string, username?: string) => {
        // Instant owner check
        if (username === 'rishittandon7') {
            setUserPlan('owner')
            localStorage.setItem('userPlan', 'owner')
            return
        }

        // Check localStorage cache first
        const cachedPlan = localStorage.getItem('userPlan')
        if (cachedPlan) {
            setUserPlan(cachedPlan as PlanType)
        }

        // Fetch from DB
        try {
            const { data: settings } = await supabase
                .from('user_settings')
                .select('plan_type')
                .eq('id', userId)
                .single()

            if (settings?.plan_type) {
                setUserPlan(settings.plan_type as PlanType)
                localStorage.setItem('userPlan', settings.plan_type)
            }
        } catch (error) {
            console.error('Error fetching user plan:', error)
        }
    }

    const handleSession = async (session: Session | null) => {
        if (session?.user) {
            setUser(session.user)
            await fetchUserPlan(session.user.id, session.user.user_metadata?.user_name)
        } else {
            setUser(null)
            setUserPlan(null)
            localStorage.removeItem('userPlan')
        }
        setLoading(false)
    }

    useEffect(() => {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🎯 Auth event:', event)
            await handleSession(session)
        })

        // Then check for existing session
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    await handleSession(session)
                } else {
                    // No session found, stop loading
                    setLoading(false)
                }
            } catch (error) {
                console.error('Auth initialization error:', error)
                setLoading(false)
            }
        }

        initializeAuth()

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setUserPlan(null)
        localStorage.removeItem('userPlan')
        window.location.href = '/'
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
