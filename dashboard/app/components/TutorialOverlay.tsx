'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Sparkles, Hand } from 'lucide-react'

// Tutorial step definition
export interface TutorialStep {
    id: string
    page: 'home' | 'dashboard' | 'setup' | 'any'
    title: string
    description: string
    targetSelector: string
    position: 'top' | 'bottom' | 'left' | 'right' | 'center'
    showHand?: boolean
    waitForClick?: boolean
    autoAdvance?: number // ms to wait before auto-advancing
}

// Complete onboarding flow
export const onboardingSteps: TutorialStep[] = [
    // HOME PAGE STEPS
    {
        id: 'click-logo',
        page: 'home',
        title: '👆 Click the GitMaxer Logo!',
        description: 'Tap the logo to see the menu with Tutorial, About Us, and more!',
        targetSelector: '[data-tutorial="logo"]',
        position: 'bottom',
        showHand: true,
        waitForClick: true
    },
    {
        id: 'click-tutorial',
        page: 'home',
        title: '📖 Open Tutorial',
        description: 'Click "Tutorial" to learn how GitMaxer works!',
        targetSelector: '[data-tutorial="tutorial-link"]',
        position: 'right',
        showHand: true,
        waitForClick: true
    },
    {
        id: 'check-pricing',
        page: 'home',
        title: '💰 Check Our Plans',
        description: 'Click Pricing to see Free, Pro, and Enterprise plans!',
        targetSelector: '[data-tutorial="pricing"]',
        position: 'bottom',
        showHand: true,
        waitForClick: false
    },
    {
        id: 'signup-github',
        page: 'home',
        title: '🚀 Sign Up to Get Started!',
        description: 'Click "Sign up with GitHub" to create your account and start your streak!',
        targetSelector: '[data-tutorial="signup-github"]',
        position: 'top',
        showHand: true,
        waitForClick: true
    },
    // SETUP PAGE STEPS (after login)
    {
        id: 'setup-repo-name',
        page: 'setup',
        title: '📁 Choose Your Repository Name',
        description: 'Enter a name for your contribution repository. We suggest "daily-commits" but you can use any name!',
        targetSelector: '[data-tutorial="repo-name"]',
        position: 'bottom',
        showHand: true,
        waitForClick: false
    },
    {
        id: 'setup-time',
        page: 'setup',
        title: '⏰ Set Contribution Time',
        description: 'Choose when GitMaxer should make your daily commits. Pick a time that matches your timezone!',
        targetSelector: '[data-tutorial="commit-time"]',
        position: 'bottom',
        showHand: true,
        waitForClick: false
    },
    {
        id: 'setup-save',
        page: 'setup',
        title: '✅ Save Your Settings',
        description: 'Click Save to complete your setup and start your automated contributions!',
        targetSelector: '[data-tutorial="save-button"]',
        position: 'top',
        showHand: true,
        waitForClick: true
    },
    // DASHBOARD STEPS
    {
        id: 'dashboard-welcome',
        page: 'dashboard',
        title: '🎉 Welcome to Your Dashboard!',
        description: 'This is your control center. Here you can see your streak status and manage settings.',
        targetSelector: 'body',
        position: 'center',
        showHand: false,
        waitForClick: false,
        autoAdvance: 3000
    },
    {
        id: 'dashboard-streak',
        page: 'dashboard',
        title: '🟩 Your Streak Status',
        description: 'This shows your current contribution streak. GitMaxer keeps it green forever!',
        targetSelector: '[data-tutorial="streak-status"]',
        position: 'bottom',
        showHand: true,
        waitForClick: false
    },
    {
        id: 'dashboard-settings',
        page: 'dashboard',
        title: '⚙️ Quick Settings',
        description: 'Access your settings here to change repo, time, or pause contributions.',
        targetSelector: '[data-tutorial="settings"]',
        position: 'left',
        showHand: true,
        waitForClick: false
    },
    {
        id: 'complete',
        page: 'any',
        title: '🏆 All Done!',
        description: 'You\'re all set! GitMaxer will now automatically maintain your GitHub streak. Enjoy!',
        targetSelector: 'body',
        position: 'center',
        showHand: false,
        waitForClick: false
    }
]

interface TutorialContextType {
    isActive: boolean
    currentStepIndex: number
    currentStep: TutorialStep | null
    startTutorial: () => void
    endTutorial: () => void
    nextStep: () => void
    prevStep: () => void
    pauseTutorial: () => void
    resumeTutorial: () => void
    skipToPage: (page: string) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

const STORAGE_KEY = 'gitmaxer_tutorial'

export function useTutorial() {
    const context = useContext(TutorialContext)
    if (!context) {
        // Return a safe default when not in provider (SSR)
        return {
            isActive: false,
            currentStepIndex: 0,
            currentStep: null,
            startTutorial: () => { },
            endTutorial: () => { },
            nextStep: () => { },
            prevStep: () => { },
            pauseTutorial: () => { },
            resumeTutorial: () => { },
            skipToPage: () => { }
        }
    }
    return context
}

export function TutorialProvider({ children }: { children: ReactNode }) {
    const [isActive, setIsActive] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [currentPage, setCurrentPage] = useState<string>('home')

    // Load tutorial state from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return

        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const state = JSON.parse(saved)
                if (state.isActive && !state.completed) {
                    setIsActive(true)
                    setCurrentStepIndex(state.stepIndex || 0)
                    setIsPaused(state.isPaused || false)
                }
            } catch (e) {
                console.error('Failed to parse tutorial state')
            }
        }

        // Detect current page
        const path = window.location.pathname
        if (path.includes('dashboard')) {
            setCurrentPage('dashboard')
        } else if (path.includes('setup')) {
            setCurrentPage('setup')
        } else {
            setCurrentPage('home')
        }
    }, [])

    // Save state whenever it changes
    useEffect(() => {
        if (typeof window === 'undefined') return

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            isActive,
            stepIndex: currentStepIndex,
            isPaused,
            completed: currentStepIndex >= onboardingSteps.length
        }))
    }, [isActive, currentStepIndex, isPaused])

    const currentStep = isActive && !isPaused ? onboardingSteps[currentStepIndex] : null

    const startTutorial = useCallback(() => {
        setCurrentStepIndex(0)
        setIsActive(true)
        setIsPaused(false)
    }, [])

    const endTutorial = useCallback(() => {
        setIsActive(false)
        setCurrentStepIndex(0)
        localStorage.removeItem(STORAGE_KEY)
    }, [])

    const nextStep = useCallback(() => {
        if (currentStepIndex < onboardingSteps.length - 1) {
            const nextIndex = currentStepIndex + 1
            const nextStepData = onboardingSteps[nextIndex]

            // Check if next step is for a different page
            if (nextStepData.page !== 'any' && nextStepData.page !== currentPage) {
                // Pause until user navigates
                setIsPaused(true)
            }

            setCurrentStepIndex(nextIndex)
        } else {
            endTutorial()
        }
    }, [currentStepIndex, currentPage, endTutorial])

    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1)
        }
    }, [currentStepIndex])

    const pauseTutorial = useCallback(() => {
        setIsPaused(true)
    }, [])

    const resumeTutorial = useCallback(() => {
        setIsPaused(false)
    }, [])

    const skipToPage = useCallback((page: string) => {
        // Find the first step for this page
        const pageStepIndex = onboardingSteps.findIndex(s => s.page === page)
        if (pageStepIndex !== -1) {
            setCurrentStepIndex(pageStepIndex)
            setCurrentPage(page)
            setIsPaused(false)
        }
    }, [])

    return (
        <TutorialContext.Provider value={{
            isActive: isActive && !isPaused,
            currentStepIndex,
            currentStep,
            startTutorial,
            endTutorial,
            nextStep,
            prevStep,
            pauseTutorial,
            resumeTutorial,
            skipToPage
        }}>
            {children}
            <TutorialOverlay />
        </TutorialContext.Provider>
    )
}

function TutorialOverlay() {
    const { isActive, currentStep, currentStepIndex, endTutorial, nextStep, prevStep } = useTutorial()
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Find and highlight target element
    useEffect(() => {
        if (!mounted || !isActive || !currentStep) return

        const findTarget = () => {
            if (currentStep.targetSelector === 'body' || currentStep.position === 'center') {
                setTargetRect(null)
                return
            }

            const target = document.querySelector(currentStep.targetSelector) as HTMLElement
            if (target) {
                const rect = target.getBoundingClientRect()
                setTargetRect(rect)

                // Add highlight class
                target.classList.add('tutorial-highlight')

                // Scroll into view
                target.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } else {
                setTargetRect(null)
            }
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(findTarget, 100)

        window.addEventListener('resize', findTarget)
        window.addEventListener('scroll', findTarget)

        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', findTarget)
            window.removeEventListener('scroll', findTarget)
            document.querySelectorAll('.tutorial-highlight').forEach(el => {
                el.classList.remove('tutorial-highlight')
            })
        }
    }, [mounted, isActive, currentStep, currentStepIndex])

    // Auto-advance if specified
    useEffect(() => {
        if (!isActive || !currentStep?.autoAdvance) return

        const timer = setTimeout(() => {
            nextStep()
        }, currentStep.autoAdvance)

        return () => clearTimeout(timer)
    }, [isActive, currentStep, nextStep])

    if (!mounted || !isActive || !currentStep) return null

    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 768

    // Calculate tooltip position
    let tooltipX = windowWidth / 2 - 160
    let tooltipY = windowHeight / 2 - 100

    if (targetRect && currentStep.position !== 'center') {
        tooltipX = Math.min(Math.max(targetRect.left + targetRect.width / 2 - 160, 20), windowWidth - 340)

        switch (currentStep.position) {
            case 'top':
                tooltipY = targetRect.top - 220
                break
            case 'bottom':
                tooltipY = targetRect.bottom + 20
                break
            case 'left':
                tooltipX = targetRect.left - 340
                tooltipY = targetRect.top
                break
            case 'right':
                tooltipX = targetRect.right + 20
                tooltipY = targetRect.top
                break
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] pointer-events-none"
            >
                {/* Dark overlay */}
                <svg className="absolute inset-0 w-full h-full">
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {targetRect && (
                                <rect
                                    x={targetRect.left - 12}
                                    y={targetRect.top - 12}
                                    width={targetRect.width + 24}
                                    height={targetRect.height + 24}
                                    rx="16"
                                    fill="black"
                                />
                            )}
                        </mask>
                    </defs>
                    <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="rgba(0,0,0,0.8)"
                        mask="url(#spotlight-mask)"
                    />
                </svg>

                {/* Glowing highlight border */}
                {targetRect && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute rounded-2xl pointer-events-none"
                        style={{
                            left: targetRect.left - 12,
                            top: targetRect.top - 12,
                            width: targetRect.width + 24,
                            height: targetRect.height + 24,
                            border: '3px solid #22d3ee',
                            boxShadow: '0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.4), inset 0 0 30px rgba(34, 211, 238, 0.1)'
                        }}
                    >
                        {/* Pulsing border */}
                        <motion.div
                            className="absolute inset-0 rounded-2xl border-3 border-cyan-400"
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [0.8, 0.4, 0.8]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </motion.div>
                )}

                {/* Animated Hand Pointer */}
                {currentStep.showHand && targetRect && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: [0, -10, 0]
                        }}
                        transition={{
                            y: { duration: 0.8, repeat: Infinity },
                            opacity: { duration: 0.3 }
                        }}
                        className="absolute z-[10000] pointer-events-none"
                        style={{
                            left: targetRect.left + targetRect.width / 2 - 20,
                            top: targetRect.bottom + 10
                        }}
                    >
                        <div className="relative">
                            <span className="text-4xl">👆</span>
                            <motion.span
                                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            >
                                Click here!
                            </motion.span>
                        </div>
                    </motion.div>
                )}

                {/* Tooltip Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                    className="absolute pointer-events-auto"
                    style={{
                        left: tooltipX,
                        top: Math.max(20, Math.min(tooltipY, windowHeight - 280))
                    }}
                >
                    <div className="w-80 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-500/50 rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-b border-white/10 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={18} className="text-cyan-400" />
                                    <span className="text-xs text-cyan-400 font-medium">
                                        Step {currentStepIndex + 1} of {onboardingSteps.length}
                                    </span>
                                </div>
                                <button
                                    onClick={endTutorial}
                                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-red-500/50 flex items-center justify-center transition-all"
                                >
                                    <X size={14} className="text-gray-400" />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-white mt-2">{currentStep.title}</h3>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                                {currentStep.description}
                            </p>
                        </div>

                        {/* Navigation */}
                        <div className="border-t border-white/10 p-3 flex items-center justify-between bg-black/30">
                            <button
                                onClick={prevStep}
                                disabled={currentStepIndex === 0}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${currentStepIndex === 0
                                        ? 'text-gray-600 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <ChevronLeft size={16} />
                                Back
                            </button>

                            {/* Progress dots */}
                            <div className="flex gap-1">
                                {onboardingSteps.slice(0, 7).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStepIndex
                                                ? 'bg-cyan-400 w-3'
                                                : i < currentStepIndex
                                                    ? 'bg-cyan-400/50'
                                                    : 'bg-gray-600'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={nextStep}
                                className="flex items-center gap-1 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg"
                            >
                                {currentStepIndex === onboardingSteps.length - 1 ? 'Finish' : 'Next'}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
