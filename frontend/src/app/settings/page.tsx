'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { useTheme, AccentColor } from '@/components/theme/ThemeProvider'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserMenu } from '@/components/layout/UserMenu'

type Theme = 'light' | 'dark' | 'system'

type UserSettings = {
  theme: Theme
  accent_color: AccentColor
  full_name: string
  language: string
  llm_model: string
  temperature: number
  max_tokens: number
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, accentColor, setAccentColor, resolvedTheme, activePalette } = useTheme()
  const queryClient = useQueryClient()
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme)
  const [fullName, setFullName] = useState('Rakshit Katiyar')
  const [llmModel, setLlmModel] = useState('gemma2-9b-it')
  const [temperature, setTemperature] = useState(0.95)
  const [language, setLanguage] = useState('en')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Auth guard
  useEffect(() => {
    let mounted = true
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted && !session && !window.location.hash.includes('access_token')) {
        router.push('/login')
      }
    }
    checkSession()
    return () => { mounted = false }
  }, [router])

  // Sync selectedTheme when theme from context changes
  useEffect(() => {
    setSelectedTheme(theme)
  }, [theme])

  // Fetch settings from backend
  const { data: settingsData } = useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      return res.data
    }
  })

  useEffect(() => {
    if (settingsData) {
      if (settingsData.theme) {
        setSelectedTheme(settingsData.theme)
      }
      if (settingsData.accent_color) {
        setAccentColor(settingsData.accent_color)
      }
      if (settingsData.full_name) setFullName(settingsData.full_name)
      if (settingsData.llm_model) setLlmModel(settingsData.llm_model)
      if (settingsData.temperature !== undefined) setTemperature(Number(settingsData.temperature))
      if (settingsData.language) setLanguage(settingsData.language)
    }
  }, [settingsData])

  // Mutation to save settings
  const saveMutation = useMutation({
    mutationFn: async (updatedFields: Partial<UserSettings>) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/settings/`, updatedFields, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] })
      setSaveStatus('Settings saved successfully!')
      setTimeout(() => setSaveStatus(null), 3500)
    },
    onError: (err) => {
      console.error('Failed to save settings:', err)
      setSaveStatus('Error saving settings.')
      setTimeout(() => setSaveStatus(null), 3500)
    }
  })

  const handleThemeChange = (newTheme: Theme) => {
    setSelectedTheme(newTheme)
    setTheme(newTheme)
    const label = newTheme === 'system' ? 'System Preference' : newTheme === 'dark' ? 'Dark Mode' : 'Light Mode'
    setSaveStatus(`Theme updated to ${label}`)
    setTimeout(() => setSaveStatus(null), 3000)
  }

  const handleAccentColorChange = (newColor: AccentColor) => {
    setAccentColor(newColor)
    const label = newColor.charAt(0).toUpperCase() + newColor.slice(1)
    setSaveStatus(`Accent color updated to ${label}`)
    setTimeout(() => setSaveStatus(null), 3000)
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
  }

  const handleSaveAllSettings = () => {
    saveMutation.mutate({
      full_name: fullName,
      theme: selectedTheme,
      accent_color: accentColor,
      llm_model: llmModel,
      temperature,
      language: language as any
    })
  }

  const userInitial = (fullName || 'R').charAt(0).toUpperCase()
  const firstName = fullName ? fullName.split(' ')[0] : 'Rakshit'

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Settings Canvas */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-gradient-to-br from-[#edf4fe] via-[#f2f6fe] to-[#f8faff] dark:from-slate-950 dark:via-[#090d16] dark:to-slate-950 custom-scroll selection:bg-emerald-500 selection:text-white transition-colors duration-300">
        
        {/* Ambient Artwork Layer */}
        
        {/* Top Right Handwritten Inspiration Text ('Learn Customize Grow.') */}
        <div className="fixed top-14 right-6 lg:right-16 w-32 sm:w-40 z-0 hidden md:block select-none pointer-events-none opacity-90 transition-opacity">
          <img 
            src="/settings_top_text.png" 
            alt="Learn Customize Grow." 
            className="w-full h-auto dark:hidden"
          />
          <img 
            src="/settings_top_text_dark.png" 
            alt="Learn Customize Grow." 
            className="w-full h-auto hidden dark:block"
          />
        </div>

        {/* Bottom Left Handwritten Inspiration Text ('Your Learning Your Rules') */}
        <div className="fixed bottom-8 left-8 lg:left-14 w-28 sm:w-36 z-0 hidden xl:block select-none pointer-events-none opacity-90 transition-opacity">
          <img 
            src="/settings_bot_text.png" 
            alt="Your Learning Your Rules" 
            className="w-full h-auto dark:hidden"
          />
          <img 
            src="/settings_bot_text_dark.png" 
            alt="Your Learning Your Rules" 
            className="w-full h-auto hidden dark:block"
          />
        </div>

        {/* Bottom Right 3D Study Element (Stack of Books 'Discipline Creates Freedom' + Plant) */}
        <div className="fixed bottom-0 right-0 w-[170px] lg:w-[190px] xl:w-[210px] 2xl:w-[230px] z-0 hidden lg:block select-none pointer-events-none opacity-100 transition-opacity">
          <img 
            src="/settings_books_seamless.png" 
            alt="Small Changes Big Progress" 
            className="w-full h-auto object-contain object-bottom-right dark:hidden"
          />
          <img 
            src="/settings_books_dark.png" 
            alt="Small Changes Big Progress" 
            className="w-full h-auto object-contain object-bottom-right hidden dark:block"
          />
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6">
          
          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Account &amp; Preference Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Customize your interface theme, AI model, and application preferences.
              </p>
            </div>

            {/* Right Controls: Back to Dashboard + Notification Bell + User Profile */}
            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              
              {/* Back to Dashboard Button */}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#eff6ff] dark:bg-slate-800/80 hover:bg-[#dbeafe] dark:hover:bg-slate-700 text-[#2563eb] dark:text-blue-400 text-xs font-semibold rounded-full border border-blue-100 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>

              <UserMenu userName={firstName} subtitle="Hello," />
            </div>
          </div>

          {/* Save Status Notification Toast */}
          {saveStatus && (
            <div 
              className="p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200"
              style={{
                backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                borderColor: resolvedTheme === 'dark' ? activePalette.darkBorder : activePalette.border,
                color: resolvedTheme === 'dark' ? activePalette.darkText : activePalette.text
              }}
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Card 1: Profile */}
          <section className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                  color: activePalette.primary
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage your account identity details.</p>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative flex items-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-2xs">
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-transparent ml-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Appearance & Theme */}
          <section className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                  color: activePalette.primary
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l9.804-9.804a2.25 2.25 0 013.182 3.182l-9.804 9.804m-3.182-3.182l-6.402 6.402" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Appearance &amp; Theme</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose how EduAI Assistant looks to you.</p>
              </div>
            </div>

            {/* Theme 3-card selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                style={
                  selectedTheme === 'light'
                    ? {
                        borderColor: activePalette.primary,
                        backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light
                      }
                    : {}
                }
                className={`relative p-5 rounded-2xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border ${
                  selectedTheme === 'light'
                    ? 'border-2 shadow-sm'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800 shadow-2xs'
                }`}
              >
                {selectedTheme === 'light' && (
                  <span 
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-2xs"
                    style={{ backgroundColor: activePalette.primary }}
                  >
                    ✓
                  </span>
                )}
                <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Light Mode</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Clean, bright interface</p>
                </div>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                style={
                  selectedTheme === 'dark'
                    ? {
                        borderColor: activePalette.primary,
                        backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light
                      }
                    : {}
                }
                className={`relative p-5 rounded-2xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border ${
                  selectedTheme === 'dark'
                    ? 'border-2 shadow-sm'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800 shadow-2xs'
                }`}
              >
                {selectedTheme === 'dark' && (
                  <span 
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-2xs"
                    style={{ backgroundColor: activePalette.primary }}
                  >
                    ✓
                  </span>
                )}
                <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Dark Mode</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sleek, dark contrast</p>
                </div>
              </button>

              {/* System Preference */}
              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                style={
                  selectedTheme === 'system'
                    ? {
                        borderColor: activePalette.primary,
                        backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light
                      }
                    : {}
                }
                className={`relative p-5 rounded-2xl flex flex-col items-center text-center gap-3 transition-all cursor-pointer border ${
                  selectedTheme === 'system'
                    ? 'border-2 shadow-sm'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800 shadow-2xs'
                }`}
              >
                {selectedTheme === 'system' && (
                  <span 
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold shadow-2xs"
                    style={{ backgroundColor: activePalette.primary }}
                  >
                    ✓
                  </span>
                )}
                <div className="w-11 h-11 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">System Preference</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sync with operating system</p>
                </div>
              </button>

            </div>

            {/* Accent Color Selection */}
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">Accent Color</h3>
              <div className="flex items-center gap-5">
                {[
                  { id: 'emerald', hex: '#10b981', name: 'Emerald' },
                  { id: 'teal', hex: '#14b8a6', name: 'Teal' },
                  { id: 'sky', hex: '#0ea5e9', name: 'Sky' },
                  { id: 'violet', hex: '#8b5cf6', name: 'Violet' }
                ].map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleAccentColorChange(color.id as AccentColor)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        accentColor === color.id 
                          ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-400 dark:ring-slate-300 scale-105 shadow-xs' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {accentColor === color.id && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[11px] font-medium transition-colors ${
                      accentColor === color.id
                        ? 'text-slate-900 dark:text-slate-100 font-bold'
                        : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                    }`}>
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </section>

          {/* Card 3: AI Model Configuration */}
          <section className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6 transition-colors">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                  color: activePalette.primary
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">AI Model Configuration</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configure backend LLM engine &amp; parameters.</p>
              </div>
            </div>

            <div className="space-y-5 pt-1">
              
              {/* LLM Engine Model */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  LLM Engine Model
                </label>
                <div className="relative flex items-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="w-full bg-transparent ml-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-6 appearance-none"
                  >
                    <option value="gemma2-9b-it" className="dark:bg-slate-800">Gemma 2 9B IT (Google Gemma)</option>
                    <option value="llama-3.3-70b-versatile" className="dark:bg-slate-800">Llama 3.3 70B Versatile (Recommended / Fast)</option>
                    <option value="llama-3.1-8b-instant" className="dark:bg-slate-800">Llama 3.1 8B Instant (Ultra Fast)</option>
                    <option value="deepseek-r1-distill-llama-70b" className="dark:bg-slate-800">DeepSeek R1 Distill 70B (Reasoning)</option>
                  </select>
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Temperature (Creativity): {temperature.toFixed(2)}
                  </label>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {temperature <= 0.3 ? 'Factual / Precise' : temperature <= 0.7 ? 'Balanced' : 'Creative'}
                  </span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    style={{ accentColor: activePalette.primary }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Application Language */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Application Language
                </label>
                <div className="relative flex items-center bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 shadow-2xs focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                  </svg>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full bg-transparent ml-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-6 appearance-none"
                  >
                    <option value="en" className="dark:bg-slate-800">English (US)</option>
                    <option value="hi" className="dark:bg-slate-800">Hindi (हिंदी)</option>
                    <option value="es" className="dark:bg-slate-800">Spanish (Español)</option>
                    <option value="fr" className="dark:bg-slate-800">French (Français)</option>
                    <option value="de" className="dark:bg-slate-800">German (Deutsch)</option>
                  </select>
                  <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              {/* Save All Settings Button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAllSettings}
                  disabled={saveMutation.isPending}
                  style={{ backgroundColor: activePalette.primary }}
                  className="px-5 py-2.5 hover:opacity-90 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saveMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                      <span>Save All Settings</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
