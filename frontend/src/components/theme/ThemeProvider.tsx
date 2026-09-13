'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'emerald' | 'teal' | 'sky' | 'violet'

export interface AccentPalette {
  name: string
  primary: string
  hover: string
  light: string
  darkLight: string
  border: string
  darkBorder: string
  text: string
  darkText: string
  ring: string
}

export const ACCENT_PALETTES: Record<AccentColor, AccentPalette> = {
  emerald: {
    name: 'Emerald',
    primary: '#10b981',
    hover: '#059669',
    light: '#ecfdf5',
    darkLight: 'rgba(16, 185, 129, 0.15)',
    border: '#a7f3d0',
    darkBorder: '#065f46',
    text: '#047857',
    darkText: '#34d399',
    ring: 'rgba(16, 185, 129, 0.35)',
  },
  teal: {
    name: 'Teal',
    primary: '#14b8a6',
    hover: '#0d9488',
    light: '#f0fdfa',
    darkLight: 'rgba(20, 184, 166, 0.15)',
    border: '#99f6e4',
    darkBorder: '#115e59',
    text: '#0f766e',
    darkText: '#2dd4bf',
    ring: 'rgba(20, 184, 166, 0.35)',
  },
  sky: {
    name: 'Sky',
    primary: '#0ea5e9',
    hover: '#0284c7',
    light: '#f0f9ff',
    darkLight: 'rgba(14, 165, 233, 0.15)',
    border: '#bae6fd',
    darkBorder: '#075985',
    text: '#0369a1',
    darkText: '#38bdf8',
    ring: 'rgba(14, 165, 233, 0.35)',
  },
  violet: {
    name: 'Violet',
    primary: '#8b5cf6',
    hover: '#7c3aed',
    light: '#f5f3ff',
    darkLight: 'rgba(139, 92, 246, 0.15)',
    border: '#ddd6fe',
    darkBorder: '#5b21b6',
    text: '#6d28d9',
    darkText: '#a78bfa',
    ring: 'rgba(139, 92, 246, 0.35)',
  }
}

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  activePalette: AccentPalette
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  accentColor: 'teal',
  setAccentColor: () => {},
  activePalette: ACCENT_PALETTES.teal
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [accentColor, setAccentColorState] = useState<AccentColor>('teal')

  const applyThemeClasses = (targetTheme: Theme, currentAccent: AccentColor): 'light' | 'dark' => {
    if (typeof document === 'undefined') return 'light'
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    let effectiveTheme: 'light' | 'dark' = 'light'
    if (targetTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      effectiveTheme = systemDark ? 'dark' : 'light'
    } else {
      effectiveTheme = targetTheme
    }

    root.classList.add(effectiveTheme)
    root.setAttribute('data-theme', effectiveTheme)
    setResolvedTheme(effectiveTheme)
    applyAccentVariables(currentAccent, effectiveTheme === 'dark')
    return effectiveTheme
  }

  const applyAccentVariables = (color: AccentColor, isDark: boolean) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const palette = ACCENT_PALETTES[color] || ACCENT_PALETTES.teal

    root.style.setProperty('--accent-primary', palette.primary)
    root.style.setProperty('--accent-hover', palette.hover)
    root.style.setProperty('--accent-light', isDark ? palette.darkLight : palette.light)
    root.style.setProperty('--accent-border', isDark ? palette.darkBorder : palette.border)
    root.style.setProperty('--accent-text', isDark ? palette.darkText : palette.text)
    root.style.setProperty('--accent-ring', palette.ring)
    root.style.setProperty('--color-primary', palette.primary)
    root.setAttribute('data-accent', color)
  }

  // Sync settings directly with backend in background
  const syncWithBackend = async (payload: { theme?: Theme; accent_color?: AccentColor }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/`,
        payload,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
    } catch (err) {
      console.warn('Background theme sync warning:', err)
    }
  }

  useEffect(() => {
    // 1. Initial local load
    const savedTheme = (localStorage.getItem('app_theme') as Theme) || 'system'
    const savedColor = (localStorage.getItem('app_accent_color') as AccentColor) || 'teal'

    setThemeState(savedTheme)
    setAccentColorState(savedColor)
    applyThemeClasses(savedTheme, savedColor)

    // 2. Fetch remote settings
    const fetchBackendTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        )

        if (res.data) {
          const remoteTheme = res.data.theme as Theme | undefined
          const remoteColor = res.data.accent_color as AccentColor | undefined

          if (remoteTheme && remoteTheme !== savedTheme) {
            setThemeState(remoteTheme)
            localStorage.setItem('app_theme', remoteTheme)
          }
          if (remoteColor && remoteColor !== savedColor) {
            setAccentColorState(remoteColor)
            localStorage.setItem('app_accent_color', remoteColor)
          }
          applyThemeClasses(remoteTheme || savedTheme, remoteColor || savedColor)
        }
      } catch (err) {
        console.warn('Failed to fetch remote user theme settings:', err)
      }
    }
    fetchBackendTheme()

    // 3. System preference change listener
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemChange = () => {
      const currentSavedTheme = (localStorage.getItem('app_theme') as Theme) || 'system'
      if (currentSavedTheme === 'system') {
        const currentColor = (localStorage.getItem('app_accent_color') as AccentColor) || 'teal'
        applyThemeClasses('system', currentColor)
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('app_theme', newTheme)
    applyThemeClasses(newTheme, accentColor)
    syncWithBackend({ theme: newTheme })
  }

  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor)
    localStorage.setItem('app_accent_color', newColor)
    applyAccentVariables(newColor, resolvedTheme === 'dark')
    syncWithBackend({ accent_color: newColor })
  }

  const activePalette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.teal

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        accentColor,
        setAccentColor,
        activePalette
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
