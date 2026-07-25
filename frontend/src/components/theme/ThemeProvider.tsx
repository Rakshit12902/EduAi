'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {}
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')

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

  useEffect(() => {
    // Load theme from localStorage first for instant render
    const savedTheme = localStorage.getItem('app_theme') as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      applyTheme('system')
    }

    // Fetch theme from backend DB
    const fetchBackendTheme = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const res = await axios.get('http://localhost:8000/api/v1/settings/', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.data && res.data.theme) {
          const dbTheme = res.data.theme as Theme
          setThemeState(dbTheme)
          localStorage.setItem('app_theme', dbTheme)
          applyTheme(dbTheme)
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

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
