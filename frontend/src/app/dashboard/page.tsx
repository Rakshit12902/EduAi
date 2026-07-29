'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createChatMutation = useMutation({
    mutationFn: async (initialQuery: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      // Auto-generate title from the first 5 words
      const words = initialQuery.trim().split(/\s+/)
      const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '')

      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/`, 
        { title, description: "Auto-generated chat" },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      return { chatId: res.data.id, query: initialQuery }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      router.push(`/dashboard/chat/${data.chatId}?q=${encodeURIComponent(data.query)}`)
    },
    onError: (err) => {
      console.error('Failed to create chat:', err)
      setIsCreating(false)
    }
  })

  const handleSubmit = (text: string) => {
    if (!text.trim() || isCreating) return
    setIsCreating(true)
    createChatMutation.mutate(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(query)
    }
  }

  const suggestions = [
    {
      icon: 'lightbulb',
      title: 'Explain a concept',
      prompt: 'Can you explain the Krebs cycle in simple terms, step by step?',
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      icon: 'description',
      title: 'Summarize my notes',
      prompt: 'Summarize the key points from my Linear Algebra Problem Sets document.',
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      icon: 'quiz',
      title: 'Quiz me',
      prompt: "Quiz me with 5 questions on Newton's laws of motion.",
      color: 'text-primary bg-primary/10'
    },
    {
      icon: 'calculate',
      title: 'Solve a problem',
      prompt: 'Walk me through solving a definite integral using integration by parts.',
      color: 'text-indigo-500 bg-indigo-500/10'
    }
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full p-6 bg-surface-container-lowest">
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
        
        {/* Header */}
        <div className="mb-8 w-16 h-16 bg-primary-container text-on-primary-container rounded-3xl flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">auto_awesome</span>
        </div>
        <h1 className="text-3xl font-display font-semibold text-on-surface mb-2 text-center">
          What are you studying today?
        </h1>
        <p className="text-on-surface-variant text-sm mb-12 text-center">
          Ask EduAI anything about the documents in your knowledge base.
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSubmit(item.prompt)}
              disabled={isCreating}
              className="flex flex-col text-left p-5 rounded-2xl border border-outline-variant/40 bg-surface-container-low hover:bg-surface-container hover:border-primary/30 transition-all group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.color}`}>
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                </div>
                <span className="font-semibold text-on-surface">{item.title}</span>
              </div>
              <p className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
                {item.prompt}
              </p>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="w-full relative flex items-center bg-surface-container-low rounded-3xl p-2 shadow-sm border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents... (Press Enter to send)"
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-on-surface placeholder:text-on-surface-variant/60"
            disabled={isCreating}
          />
          <button 
            onClick={() => handleSubmit(query)}
            disabled={isCreating || !query.trim()}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant"
          >
            {isCreating ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
