'use client'

// components/NavbarVisibilityWrapper.tsx
// Place at: components/NavbarVisibilityWrapper.tsx
//
// A thin client wrapper that reads the current pathname and conditionally
// renders its children (the Navbar). This is needed because layout.tsx is a
// Server Component — only client components can call usePathname().

import { usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

// Any route that starts with /dashboard hides the navbar.
// Add more prefixes to HIDDEN_PREFIXES if you add more full-screen pages later.
const HIDDEN_PREFIXES = ['/dashboard']

export function NavbarVisibilityWrapper({ children }: Props) {
  const pathname = usePathname()
  const hidden   = HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (hidden) return null
  return <>{children}</>
}
