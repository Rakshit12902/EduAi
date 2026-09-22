'use client'

import { useState, useRef, useEffect } from 'react'

export interface ModelOption {
  id: string
  name: string
  tier: string
  speed?: string
  capability?: string
  description: string
  provider: 'google' | 'groq' | 'anthropic'
  hasInfo?: boolean
}

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tier: 'Medium',
    speed: 'Fast',
    capability: 'PDF & Docs',
    description: 'Supports uploaded files (PDF, MD, TXT, images) with full vision & document RAG',
    provider: 'google',
    hasInfo: true
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    tier: 'Lightweight',
    speed: 'Ultra Fast',
    capability: 'PDF & Docs',
    description: 'Ultra-low latency document analysis and file parsing (PDF, MD, TXT)',
    provider: 'google',
    hasInfo: true
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B',
    tier: 'Medium',
    speed: 'Fast',
    capability: 'Deep Thinking',
    description: 'Advanced reasoning, step-by-step thinking, and deep conceptual explanations',
    provider: 'groq',
    hasInfo: true
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT-OSS 20B',
    tier: 'Lightweight',
    speed: 'Instant',
    capability: 'Quick Chat',
    description: 'Instant response token streaming for rapid Q&A and general study assistance',
    provider: 'groq',
    hasInfo: true
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 3.8 27B',
    tier: 'Reasoning',
    speed: 'Fast',
    capability: 'Code & Math',
    description: 'Specialized for writing code, algorithms, math problem-solving, and logic',
    provider: 'groq',
    hasInfo: true
  }
]



interface ModelSelectorProps {
  selectedModel: string
  onSelectModel: (modelId: string) => void
  dropDirection?: 'up' | 'down'
  compact?: boolean
}

export default function ModelSelector({
  selectedModel,
  onSelectModel,
  dropDirection = 'up',
  compact = false
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [infoTooltip, setInfoTooltip] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)


  // Find currently active model details
  const activeModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || 
    AVAILABLE_MODELS.find(m => m.id === 'gemini-3.8-flash') || 
    AVAILABLE_MODELS[0]

  // Close on outside click or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setInfoTooltip(null)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setInfoTooltip(null)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button Matching Reference Image */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all cursor-pointer select-none font-sans text-[11px] sm:text-xs border ${
          isOpen
            ? 'bg-slate-200 dark:bg-[#2a2b30] border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white shadow-sm'
            : 'bg-slate-100/90 hover:bg-slate-200/80 dark:bg-[#1a1b1e] dark:hover:bg-[#25262b] border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs'
        }`}
        title={`Current Model: ${activeModel.name}`}
      >
        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[180px]">
          {activeModel.name}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden md:inline">
          {activeModel.capability || activeModel.tier}
        </span>
        
        {/* Chevron Icon (flips based on dropDirection and isOpen) */}
        <svg
          className={`w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
            dropDirection === 'up'
              ? (isOpen ? 'rotate-180' : '')
              : (isOpen ? 'rotate-180' : '')
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          {dropDirection === 'up' ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          )}
        </svg>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`fixed sm:absolute ${
            dropDirection === 'up' ? 'bottom-20 sm:bottom-full sm:mb-2' : 'top-20 sm:top-full sm:mt-2'
          } left-3 right-3 sm:left-auto sm:right-0 w-auto sm:w-max max-w-[calc(100vw-1.5rem)] sm:max-w-[340px] rounded-2xl bg-white dark:bg-[#18191c] border border-slate-200 dark:border-[#2e3036] shadow-2xl sm:shadow-xl shadow-slate-900/15 dark:shadow-black/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
        >
          {/* Header */}
          <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-[#26272b] gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              Model
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#232428] text-slate-500 dark:text-slate-400 font-medium shrink-0">
              Dual Engine
            </span>
          </div>

          {/* Model Options List */}
          <div className="p-1 space-y-0.5">
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === activeModel.id
              return (
                <div
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 sm:gap-3 px-2 sm:px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer group whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-[#26282e] text-slate-900 dark:text-white font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-[#202125] text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 overflow-hidden">
                    <span className="truncate text-slate-900 dark:text-slate-100 font-medium text-[11px] sm:text-xs">
                      {model.name}
                    </span>
                    {model.provider === 'google' ? (
                      <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 font-semibold shrink-0 border border-blue-200/50 dark:border-blue-900/40">
                        Google
                      </span>
                    ) : (
                      <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-300 font-semibold shrink-0 border border-orange-200/50 dark:border-orange-900/40">
                        Groq
                      </span>
                    )}
                    {model.speed && (
                      <span className="text-[8px] sm:text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-[#2c2d33] text-slate-500 dark:text-slate-300 shrink-0 font-normal hidden xs:inline">
                        {model.speed}
                      </span>
                    )}
                    {model.capability && (
                      <span className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded shrink-0 font-medium ${
                        model.capability.includes('PDF')
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                          : model.capability.includes('Thinking')
                          ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40'
                          : model.capability.includes('Code')
                          ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                          : 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40'
                      }`}>
                        {model.capability}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {model.hasInfo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setInfoTooltip(infoTooltip === model.id ? null : model.id)
                        }}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={model.description}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4M12 8h.01" />
                        </svg>
                      </button>
                    )}

                    {/* Selected Checkmark */}
                    {isSelected ? (
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>


          {/* Tooltip Description Overlay if info clicked */}
          {infoTooltip && (
            <div className="p-2.5 mx-2 mb-1 rounded-xl bg-emerald-50 dark:bg-[#14231f] border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start justify-between">
              <span>{AVAILABLE_MODELS.find(m => m.id === infoTooltip)?.description}</span>
              <button
                onClick={() => setInfoTooltip(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 font-bold ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

