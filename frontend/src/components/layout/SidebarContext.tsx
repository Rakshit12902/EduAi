'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface SidebarContextType {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  toggleMobile: () => void
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Automatically close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const toggleMobile = () => setIsMobileOpen(prev => !prev)
  const toggleCollapse = () => setIsCollapsed(prev => !prev)

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile,
        isCollapsed,
        setIsCollapsed,
        toggleCollapse
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
