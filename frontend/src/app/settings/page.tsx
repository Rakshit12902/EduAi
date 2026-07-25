'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/components/theme/ThemeProvider'

type Theme = 'light' | 'dark' | 'system'

type UserSettings = {
  theme: Theme
  language: string
  llm_model: string
  temperature: number
  max_tokens: number
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme)
  const [llmModel, setLlmModel] = useState('llama-3.3-70b-versatile')
  const [temperature, setTemperature] = useState(0.20)
  const [language, setLanguage] = useState('en')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Fetch settings from backend
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['user_settings'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const res = await axios.get('http://localhost:8000/api/v1/settings/', {
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

      const res = await axios.patch('http://localhost:8000/api/v1/settings/', updatedFields, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] })
      setSaveStatus('Settings saved successfully!')
      setTimeout(() => setSaveStatus(null), 3000)
    },
    onError: (err) => {
      console.error('Failed to save settings:', err)
      setSaveStatus('Error saving settings.')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  })

  const handleThemeChange = (newTheme: Theme) => {
    setSelectedTheme(newTheme)
    setTheme(newTheme)
    saveMutation.mutate({ theme: newTheme })
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang)
    saveMutation.mutate({ language: newLang as any })
  }

  const handleSaveAIPreferences = () => {
    saveMutation.mutate({
      llm_model: llmModel,
      temperature,
      language: language as any
    })
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-6">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight text-on-surface">
              Account & Preference Settings
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Customize your interface theme, AI engine models, and application preferences.
            </p>
          </div>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-medium rounded-xl border border-outline-variant/30 transition-all shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </a>
        </div>

        {/* Save notification */}
        {saveStatus && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {saveStatus}
            </span>
          </div>
        )}

        {/* Theme Settings Card */}
        <section className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/40 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">palette</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">Appearance & Theme</h2>
              <p className="text-xs text-on-surface-variant">Choose how EduAI Assistant looks to you.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Light Option */}
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                selectedTheme === 'light'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-semibold'
                  : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">light_mode</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Light Mode</p>
                <p className="text-[11px] opacity-75 mt-0.5">Clean, bright interface</p>
              </div>
            </button>

            {/* Dark Option */}
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                selectedTheme === 'dark'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-semibold'
                  : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">dark_mode</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-[11px] opacity-75 mt-0.5">Sleek, dark contrast</p>
              </div>
            </button>

            {/* System Option */}
            <button
              onClick={() => handleThemeChange('system')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${
                selectedTheme === 'system'
                  ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-semibold'
                  : 'border-outline-variant/40 bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">desktop_windows</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">System Preference</p>
                <p className="text-[11px] opacity-75 mt-0.5">Sync with operating system</p>
              </div>
            </button>

          </div>
        </section>

        {/* AI Model & Parameters Card */}
        <section className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/40 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">psychology</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-on-surface">AI Model Configuration</h2>
              <p className="text-xs text-on-surface-variant">Configure backend LLM engine & parameters.</p>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            
            {/* Model selection */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                LLM Engine Model
              </label>
              <select
                value={llmModel}
                onChange={(e) => setLlmModel(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra Fast)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (High Context)</option>
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Temperature (Creativity): {temperature.toFixed(2)}
                </label>
                <span className="text-xs text-on-surface-variant font-mono">
                  {temperature <= 0.2 ? 'Factual / Precise' : temperature <= 0.7 ? 'Balanced' : 'Creative'}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
                Application Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="en">English (US)</option>
                <option value="hi">Hindi (हिंदी)</option>
                <option value="es">Spanish (Español)</option>
                <option value="fr">French (Français)</option>
                <option value="de">German (Deutsch)</option>
              </select>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSaveAIPreferences}
                disabled={saveMutation.isPending}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-on-primary font-medium text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Preferences
                  </>
                )}
              </button>
            </div>

          </div>
        </section>

      </div>
    </div>
  )
}
