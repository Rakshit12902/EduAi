'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { UserMenu } from '@/components/layout/UserMenu'

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [userName, setUserName] = useState('Rakshit')
  
  // File Attachment State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      } else if (user?.email) {
        const namePart = user.email.split('@')[0]
        setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1))
      }
    })
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const createChatMutation = useMutation({
    mutationFn: async ({ text, file }: { text: string; file: File | null }) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const effectiveQuery = text.trim() || (file ? `Analyze ${file.name}` : '')
      if (!effectiveQuery) return

      // Auto-generate title from the file name or first 5 words
      let title = ''
      if (file) {
        title = `Study: ${file.name.replace(/\.[^/.]+$/, '')}`
      } else {
        const words = effectiveQuery.trim().split(/\s+/)
        title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '')
      }

      // 1. Create chat session
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/`, 
        { title, description: "Auto-generated chat" },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      const chatId = res.data.id

      // 2. If a file is attached, upload it to the newly created chat
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${chatId}/documents/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${session.access_token}`
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                setUploadProgress(percentCompleted)
              }
            }
          }
        )
      }

      return { chatId, query: effectiveQuery }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      router.push(`/dashboard/chat/${data.chatId}?q=${encodeURIComponent(data.query)}`)
    },
    onError: (err: any) => {
      console.error('Failed to create chat or upload document:', err)
      setUploadError(err.response?.data?.detail || 'Failed to upload document. Please try again.')
      setIsCreating(false)
    }
  })

  const handleSubmit = (text: string) => {
    if ((!text.trim() && !selectedFile) || isCreating) return
    setIsCreating(true)
    setUploadError(null)
    createChatMutation.mutate({ text, file: selectedFile })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(query)
    }
  }

  const actionCards = [
    {
      title: 'Explain a concept',
      subtitle: 'Get simple, step-by-step explanations for any topic.',
      prompt: 'Can you explain the Krebs cycle in simple terms, step by step?',
      bgColor: 'bg-[#f0faf5] hover:bg-[#e5f7ed] border-emerald-100/90 hover:border-emerald-200 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-emerald-950 dark:hover:border-emerald-900',
      iconBg: 'bg-[#dcfce7] dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      title: 'Summarize my notes',
      subtitle: 'Turn your study materials into clear and concise summaries.',
      prompt: 'Summarize the key points from my Linear Algebra Problem Sets document.',
      bgColor: 'bg-[#f6f4fe] hover:bg-[#eeeafd] border-purple-100/90 hover:border-purple-200 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-purple-950 dark:hover:border-purple-900',
      iconBg: 'bg-[#ede9fe] dark:bg-purple-950/60 text-[#7c3aed] dark:text-purple-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      )
    },
    {
      title: 'Quiz me',
      subtitle: 'Test your understanding with custom questions.',
      prompt: "Quiz me with 5 questions on Newton's laws of motion.",
      bgColor: 'bg-[#f0f8fe] hover:bg-[#e4f3fd] border-sky-100/90 hover:border-sky-200 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-sky-950 dark:hover:border-sky-900',
      iconBg: 'bg-[#e0f2fe] dark:bg-sky-950/60 text-[#0284c7] dark:text-sky-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008v.008H12V18z" />
        </svg>
      )
    },
    {
      title: 'Solve a problem',
      subtitle: 'Get step-by-step solutions to numerical and theoretical problems.',
      prompt: 'Walk me through solving a definite integral using integration by parts.',
      bgColor: 'bg-[#fef9ee] hover:bg-[#fef3dc] border-amber-100/90 hover:border-amber-200 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-amber-950 dark:hover:border-amber-900',
      iconBg: 'bg-[#fef3c7] dark:bg-amber-950/60 text-[#d97706] dark:text-amber-400',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      )
    }
  ]

  const suggestions = [
    'Explain this topic',
    'Summarize this document',
    'Give me practice questions',
    'Solve this problem'
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] dark:bg-[#070e18] relative overflow-y-auto selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      
      {/* Top Header Bar */}
      <div className="w-full px-6 py-4 flex items-center justify-end gap-3 z-30 shrink-0">
        <UserMenu userName={userName} subtitle="Hello," />
      </div>

      {/* Decorative Sticky Note on Right Wall */}
      <div className="absolute top-20 right-8 lg:right-12 2xl:right-16 w-24 sm:w-32 z-0 hidden lg:block select-none pointer-events-none drop-shadow-sm opacity-95 transition-opacity">
        <img src="/dashboard_sticky_transparent.png" alt="A Smarter You Everyday" className="w-full h-auto dark:hidden" />
        <img src="/dashboard_sticky_dark.png" alt="A Smarter You Everyday" className="w-full h-auto hidden dark:block" />
      </div>

      {/* Decorative Potted Plant & Books on Bottom-Right */}
      <div className="absolute bottom-0 right-0 w-32 sm:w-36 xl:w-40 2xl:w-44 z-0 hidden xl:block select-none pointer-events-none opacity-100 transition-opacity">
        <img src="/dashboard_plant_seamless.png" alt="" className="w-full h-auto object-contain object-bottom-right dark:hidden" />
        <img src="/dashboard_plant_dark.png" alt="" className="w-full h-auto object-contain object-bottom-right hidden dark:block" />
      </div>

      {/* Decorative 3D Student Illustration on Bottom-Left */}
      <div className="absolute bottom-0 left-0 w-[280px] lg:w-[320px] xl:w-[360px] 2xl:w-[410px] z-0 hidden lg:block select-none pointer-events-none opacity-100 transition-opacity">
        <img src="/dashboard_student_flawless.png" alt="Student Studying" className="w-full h-auto object-contain object-bottom-left dark:hidden" />
        <img src="/dashboard_student_dark.png" alt="Student Studying" className="w-full h-auto object-contain object-bottom-left hidden dark:block" />
      </div>

      {/* Main Center Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-4 my-auto w-full max-w-4xl mx-auto z-10 relative">
        
        {/* Welcome Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#fef9c3] dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-semibold shadow-2xs mb-4 select-none">
          <span>👋</span>
          <span>Welcome back, {userName}!</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-[#0f172a] dark:text-slate-100 tracking-tight text-center leading-[1.15]">
          What are you <span className="text-[#059669] dark:text-emerald-400">studying today?</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 mb-8 text-center max-w-lg font-normal">
          Ask EduAI anything about the documents in your knowledge base.
        </p>

        {/* 2x2 Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 w-full max-w-2xl sm:max-w-3xl mb-6">
          {actionCards.map((card, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSubmit(card.prompt)}
              disabled={isCreating}
              className={`flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 text-left group shadow-2xs hover:shadow-xs active:scale-[0.99] disabled:opacity-60 cursor-pointer ${card.bgColor}`}
            >
              <div className="flex items-center gap-3.5 pr-2">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${card.iconBg}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-black dark:group-hover:text-white leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>
              </div>
              
              <div className="w-8 h-8 rounded-full border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:bg-[#059669] dark:group-hover:bg-emerald-600 group-hover:border-[#059669] dark:group-hover:border-emerald-600 group-hover:text-white flex items-center justify-center text-slate-400 dark:text-slate-300 shrink-0 transition-all shadow-2xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="w-full max-w-2xl sm:max-w-3xl mb-3 p-3 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-2xl text-xs border border-red-200 dark:border-red-800 flex items-center justify-between shadow-2xs">
            <span>{uploadError}</span>
            <button onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Selected File Attachment Badge */}
        {selectedFile && (
          <div className="w-full max-w-2xl sm:max-w-3xl mb-2 flex items-center justify-between px-4 py-2 bg-[#ecfdf5] dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl text-emerald-900 dark:text-emerald-200 shadow-2xs animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                  {isCreating && uploadProgress > 0 
                    ? `Uploading document... ${uploadProgress}%`
                    : `${(selectedFile.size / 1024).toFixed(1)} KB • Attached document ready`
                  }
                </span>
              </div>
            </div>
            {!isCreating && (
              <button 
                type="button" 
                onClick={removeFile}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Floating Chat Input Bar */}
        <div className="w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 rounded-full shadow-[0_12px_35px_-6px_rgba(15,23,42,0.08),0_0_1px_1px_rgba(226,232,240,0.8)] dark:shadow-none border border-slate-200/90 dark:border-slate-800 px-4 sm:px-5 py-2 sm:py-2.5 flex items-center gap-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all mb-4">
          
          {/* Hidden Native File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
          />

          {/* Paperclip Button */}
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isCreating}
            className="text-slate-400 dark:text-slate-500 hover:text-[#059669] dark:hover:text-emerald-400 active:scale-95 transition-all p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40" 
            title="Attach document (PDF, DOCX, TXT, MD)"
          >
            <svg className="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.552 18.32a1.5 1.5 0 01-2.121-2.121l10.59-10.59" />
            </svg>
          </button>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? `Ask anything about ${selectedFile.name}...` : "Ask anything about your documents..."}
            className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
            disabled={isCreating}
          />

          {/* Enter Hint */}
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:block select-none mr-1">
            Press Enter to send
          </span>

          {/* Send Button */}
          <button 
            type="button"
            onClick={() => handleSubmit(query)}
            disabled={isCreating || (!query.trim() && !selectedFile)}
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#059669] hover:bg-[#047857] active:bg-[#036549] text-white flex items-center justify-center shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-[#059669] cursor-pointer"
            title="Send"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            )}
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 select-none">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1">
            Try asking:
          </span>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(item)
                handleSubmit(item)
              }}
              disabled={isCreating}
              className="px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {item}
            </button>
          ))}
        </div>

        {/* Inspirational Quote Banner (from reference 04_25_33 PM) */}
        <div className="mt-8 hidden xl:flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 dark:bg-[#0c1824]/90 border border-slate-200 dark:border-emerald-500/20 text-slate-600 dark:text-slate-300 text-xs shadow-2xs select-none backdrop-blur-xs ml-auto">
          <span className="text-emerald-600 dark:text-emerald-400 font-serif text-sm leading-none">“</span>
          <span>Progress happens when curiosity meets the right guidance.</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-serif text-sm leading-none">”</span>
          <span className="w-6 h-[2px] bg-emerald-500/60 rounded-full ml-1" />
        </div>

      </div>

    </div>
  )
}
