'use client'

import { useState, useRef } from 'react'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

interface ChatInputProps {
  chatId: string
  onUploadSuccess?: () => void
  onSendMessage?: (query: string, documentIds: string[]) => void
  disabled?: boolean
}

export default function ChatInput({ chatId, onUploadSuccess, onSendMessage, disabled }: ChatInputProps) {
  const [query, setQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, id: string, size?: number}[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post(
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

      setUploadedFiles(prev => [...prev, { name: file.name, id: res.data.document_id, size: file.size }])
      if (onUploadSuccess) onUploadSuccess()
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Upload failed')
      setIsUploading(false)
    }
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = (textToSend?: string) => {
    const effectiveText = (textToSend || query).trim()
    if (!effectiveText && uploadedFiles.length === 0) return  // Don't send empty
    if (disabled || isUploading) return

    if (onSendMessage) {
      onSendMessage(effectiveText || `Analyze uploaded documents`, uploadedFiles.map(f => f.id))
    }
    setQuery('')
    setUploadedFiles([]) // Clear attachments after sending
  }

  const removeAttachment = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const suggestions = [
    {
      label: 'Summarize this document',
      prompt: 'Summarize the key points and core concepts from this document.',
      icon: (
        <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      label: 'Explain key points',
      prompt: 'Explain the most critical points and takeaways step-by-step.',
      icon: (
        <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      )
    },
    {
      label: 'Give me practice questions',
      prompt: 'Generate 5 challenging practice questions based on this material.',
      icon: (
        <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008v.008H12V18z" />
        </svg>
      )
    },
    {
      label: 'Solve this problem',
      prompt: 'Walk me through solving the numerical and theoretical problems from this topic.',
      icon: (
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      )
    }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-3 z-20 relative">
      
      {/* Suggestions Row ("You can also ask") */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          <span className="text-[#6366f1] dark:text-indigo-400 text-sm">✦</span>
          <span>You can also ask</span>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {suggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(sug.prompt)}
              disabled={disabled || isUploading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] shrink-0 cursor-pointer disabled:opacity-50"
            >
              {sug.icon}
              <span>{sug.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-2.5 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 dark:hover:text-red-200 font-bold ml-2">✕</button>
        </div>
      )}
      
      {/* Uploading indicator */}
      {isUploading && (
        <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full w-fit shadow-2xs">
          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Uploading document... {uploadProgress}%</span>
        </div>
      )}

      {/* Uploaded File Previews */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {uploadedFiles.map((f, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="max-w-[180px] truncate">{f.name}</span>
              {f.size && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">({Math.round(f.size / 1024)} KB)</span>}
              <button 
                onClick={() => removeAttachment(idx)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-emerald-200/60 dark:hover:bg-emerald-800/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                title="Remove attachment"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Floating White Pill Input Container */}
      <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-full p-2 pl-3.5 shadow-lg shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/90 dark:border-slate-800 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp"
        />
        
        {/* Attachment Paperclip Button */}
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
          title="Attach Document"
        >
          <svg className="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.557 18.315a1.5 1.5 0 11-2.121-2.121l9.818-9.818" />
          </svg>
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about your documents..."
          disabled={disabled}
          className="flex-1 bg-transparent px-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
        />

        {/* Right Tools: Model Selector Pill + Send Button */}
        <div className="flex items-center gap-2 shrink-0 pr-1">
          {/* Model Selector Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f0f4ff] dark:bg-slate-800 border border-indigo-100/90 dark:border-slate-700 text-[#4f46e5] dark:text-indigo-400 text-xs font-semibold select-none cursor-pointer hover:bg-[#e5ecff] dark:hover:bg-slate-750 transition-colors">
            <span className="text-[#6366f1] dark:text-indigo-400 text-[11px]">✦</span>
            <span>EduAI</span>
            <svg className="w-3 h-3 text-[#4f46e5] dark:text-indigo-400 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={(!query.trim() && uploadedFiles.length === 0) || disabled || isUploading}
            className="w-10 h-10 rounded-full bg-[#059669] hover:bg-[#047857] text-white flex items-center justify-center shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Send message"
          >
            <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Subtle Footer Quote */}
      <div className="w-full flex items-center justify-center gap-3 pt-1 text-slate-400 select-none">
        <span className="w-10 h-px bg-slate-200"></span>
        <span className="text-[11px] italic font-normal text-slate-400/90 tracking-wide">
          “A smarter you, for a brighter tomorrow.”
        </span>
        <span className="w-10 h-px bg-slate-200"></span>
      </div>

    </div>
  )
}
