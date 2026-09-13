'use client'

import { use, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

import ChatInput from '@/components/chat/ChatInput'
import ChatMessage, { MessageSource } from '@/components/chat/ChatMessage'
import { UserMenu } from '@/components/layout/UserMenu'

type Chat = {
  id: string
  title: string
  description: string | null
  created_at: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  answer_type?: 'document' | 'general'
  feedback_rating?: number | null
  sources?: MessageSource[]
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [userName, setUserName] = useState('Rakshit')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAutoSent = useRef(false)
  const isStreamingRef = useRef(false)

  // Fetch current user details
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

  const { data: chat } = useQuery({
    queryKey: ['chat', id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return null
      
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        return res.data as Chat
      } catch (err: any) {
        if (err.response?.status === 404) {
          router.push('/dashboard')
        }
        throw err
      }
    },
    enabled: !!id,
    retry: 2
  })

  useEffect(() => {
    if (chat?.title) {
      setTitleInput(chat.title)
    }
  }, [chat?.title])

  // Update chat title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}`, 
        { title: newTitle },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', id] })
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      setIsEditingTitle(false)
    }
  })

  const handleTitleSubmit = () => {
    if (titleInput.trim() && titleInput !== chat?.title) {
      updateTitleMutation.mutate(titleInput.trim())
    } else {
      setIsEditingTitle(false)
    }
  }

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (isStreamingRef.current) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}/messages/`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (!isStreamingRef.current) {
          setMessages(res.data)
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err)
      }
    }
    fetchMessages()
  }, [id])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = useCallback(async (query: string, documentIds: string[], replaceUrl?: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const tempUserId = Date.now().toString()
    setMessages(prev => [...prev, { id: tempUserId, role: 'user', content: query }])
    
    const tempAssistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: tempAssistantId, role: 'assistant', content: '', sources: [] }])
    setIsTyping(true)
    isStreamingRef.current = true

    if (replaceUrl) {
      router.replace(replaceUrl)
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ role: 'user', content: query })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Server returned ${response.status}: ${errorText}`)
      }

      if (!response.body) throw new Error('No response body received from server')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue
          
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.substring(6).trim()
            if (dataStr === '[DONE]') break
            
            try {
              const data = JSON.parse(dataStr)
              
              if (data.error) {
                setMessages(prev => prev.map(msg => 
                  msg.id === tempAssistantId 
                    ? { ...msg, content: (msg.content ? msg.content + '\n\n' : '') + `**Error:** ${data.error}` } 
                    : msg
                ))
              } else if (data.type === 'sources') {
                setMessages(prev => prev.map(msg => 
                  msg.id === tempAssistantId ? { ...msg, sources: data.sources, answer_type: data.answer_type } : msg
                ))
              } else if (data.type === 'token' && data.text) {
                setMessages(prev => prev.map(msg => 
                  msg.id === tempAssistantId ? { ...msg, content: msg.content + data.text } : msg
                ))
              }
            } catch (e) {
              console.error("Error parsing SSE JSON chunk:", dataStr, e)
            }
          }
        }
      }
      
      // Sync complete message list from database after streaming completes
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}/messages/`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        if (res.data && res.data.length > 0) {
          setMessages(res.data)
        }
      } catch (syncErr) {
        console.error("Failed to sync final messages from server:", syncErr)
      }

    } catch (error: any) {
      console.error("Chat streaming error:", error)
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...msg, content: msg.content + `\n\n**Error:** Failed to connect to server: ${error?.message || error}` } : msg
      ))
    } finally {
      isStreamingRef.current = false
      setIsTyping(false)
    }
  }, [id, router])

  const handleRegenerate = useCallback((assistantIndex: number) => {
    if (isTyping) return
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const queryText = messages[i].content
        handleSendMessage(queryText, [])
        break
      }
    }
  }, [messages, isTyping, handleSendMessage])

  // Auto-send initial query from dashboard navigation (?q=...)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !hasAutoSent.current) {
      hasAutoSent.current = true
      handleSendMessage(q, [], `/dashboard/chat/${id}`)
    }
  }, [searchParams, id, handleSendMessage])

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-[#edf4fe] via-[#f2f6fe] to-[#f8faff] dark:from-slate-950 dark:via-[#090d16] dark:to-slate-950 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Top Bar Header */}
      <header className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0 select-none">
        {/* Left: Chat Title & Subtitle */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-emerald-500 rounded-md px-2 py-0.5 outline-none"
              />
            ) : (
              <h1 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                {chat ? chat.title : 'New Chat'}
              </h1>
            )}

            <button
              onClick={() => setIsEditingTitle(!isEditingTitle)}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1 rounded-md transition-colors cursor-pointer"
              title="Edit chat title"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5">
            Auto-generated chat
          </span>
        </div>

        {/* Right: User Profile Menu */}
        <div className="flex items-center gap-3">
          <UserMenu userName={userName} subtitle="Hello," />
        </div>
      </header>

      {/* Ambient Artwork Layer (Blended seamlessly into background) */}
      


      {/* 3D Robot Study Setup on Right (Desk Lamp, Robot Reading, Books, Mug, Notebook) */}
      <div className="absolute bottom-0 right-0 w-[260px] lg:w-[300px] xl:w-[350px] 2xl:w-[390px] z-0 hidden xl:block select-none pointer-events-none opacity-90 transition-opacity">
        <img 
          src="/chat_robot_study.png" 
          alt="Robot Study Setup" 
          className="w-full h-auto object-contain object-bottom-right"
        />
      </div>

      {/* Floating Handwritten Inspiration Text on Top Right */}
      <div className="absolute top-20 right-8 lg:right-14 xl:right-20 w-24 sm:w-28 z-0 hidden md:block select-none pointer-events-none opacity-85 transition-opacity">
        <img 
          src="/chat_floating_text_transparent.png" 
          alt="Learn Ask Understand Grow" 
          className="w-full h-auto dark:hidden"
        />
        <img 
          src="/chat_floating_text_dark.png" 
          alt="Learn Ask Understand Grow" 
          className="w-full h-auto hidden dark:block"
        />
      </div>

      {/* Main Content Area (Messages) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col z-10 relative custom-scroll">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 flex items-center justify-center mb-3 shadow-2xs">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Ready to learn with EduAI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 leading-relaxed">
              Ask a question about your documents, summarize your notes, or solve a problem.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-3xl xl:max-w-4xl mx-auto flex flex-col pb-4">
            {messages.map((msg, idx) => (
              <ChatMessage 
                key={msg.id} 
                id={msg.id}
                chatId={id}
                role={msg.role} 
                content={msg.content} 
                answer_type={msg.answer_type} 
                sources={msg.sources} 
                initialFeedback={msg.feedback_rating}
                onRegenerate={() => handleRegenerate(idx)}
                isRegenerating={isTyping && idx === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full pb-2 pt-1 shrink-0 z-20 relative bg-gradient-to-t from-[#edf4fe] dark:from-slate-950 via-[#edf4fe]/90 dark:via-slate-950/90 to-transparent">
        <ChatInput chatId={id} onSendMessage={handleSendMessage} disabled={isTyping} />
        {/* Footer Tagline (from reference 06_42_30 PM) */}
        <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-normal italic select-none">
          <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-800" />
          <span>&ldquo;A smarter you, for a brighter tomorrow.&rdquo;</span>
          <span className="w-6 h-[1px] bg-slate-300 dark:bg-slate-800" />
        </div>
      </div>

    </div>
  )
}
