'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './AuthProvider'
import { TutorialProvider } from '../components/TutorialOverlay'

export function Providers({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <TutorialProvider>
                {children}
            </TutorialProvider>
        </AuthProvider>
    )
}
