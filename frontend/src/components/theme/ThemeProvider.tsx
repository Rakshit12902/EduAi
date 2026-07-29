'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColor = 'emerald' | 'teal' | 'sky' | 'violet'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  accentColor: 'violet',
  setAccentColor: () => {}
})

const ACCENT_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  sky: '#0ea5e9',
  violet: '#8b5cf6'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [accentColor, setAccentColorState] = useState<AccentColor>('violet')

  const applyTheme = (targetTheme: Theme) => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (targetTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemDark) {
        root.classList.add('dark')
      } else {
        root.classList.add('light')
      }
    } else {
      root.classList.add(targetTheme)
    }
  }

  const applyAccentColor = (color: AccentColor) => {
    const root = document.documentElement
    const hex = ACCENT_COLORS[color] || ACCENT_COLORS.violet
    root.style.setProperty('--color-primary', hex)
  }

  useEffect(() => {
    // Load theme and color from localStorage first for instant render
    const savedTheme = localStorage.getItem('app_theme') as Theme | null
    const savedColor = localStorage.getItem('app_accent_color') as AccentColor | null
    
    if (savedTheme) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme('system')
    }
    
    if (savedColor) {
      setAccentColorState(savedColor)
      applyAccentColor(savedColor)
    }

    // Fetch theme from backend DB
    const fetchBackendTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.data) {
          if (res.data.theme) {
            const dbTheme = res.data.theme as Theme
            setThemeState(dbTheme)
            localStorage.setItem('app_theme', dbTheme)
            applyTheme(dbTheme)
          }
          if (res.data.accent_color) {
            const dbColor = res.data.accent_color as AccentColor
            setAccentColorState(dbColor)
            localStorage.setItem('app_accent_color', dbColor)
            applyAccentColor(dbColor)
          }
        }
      } catch (err) {
        console.error('Failed to fetch user theme settings:', err)
      }
    }
    fetchBackendTheme()
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('app_theme', newTheme)
    applyTheme(newTheme)
  }
  
  const setAccentColor = (newColor: AccentColor) => {
    setAccentColorState(newColor)
    localStorage.setItem('app_accent_color', newColor)
    applyAccentColor(newColor)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
