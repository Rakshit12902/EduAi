'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

import ChatInput from '@/components/chat/ChatInput'
import ChatMessage, { MessageSource } from '@/components/chat/ChatMessage'

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
  sources?: MessageSource[]
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasAutoSent = useRef(false)

  const { data: chats } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')
      
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      return res.data as Chat[]
    }
  })

  const chat = chats?.find((c) => c.id === id)

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}/messages/`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        })
        setMessages(res.data)
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

  // Auto-send initial query
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && !hasAutoSent.current) {
      hasAutoSent.current = true
      handleSendMessage(q, [])
      router.replace(`/dashboard/chat/${id}`)
    }
  }, [searchParams, id, router])

  const handleSendMessage = async (query: string, documentIds: string[]) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const tempUserId = Date.now().toString()
    setMessages(prev => [...prev, { id: tempUserId, role: 'user', content: query }])
    
    const tempAssistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: tempAssistantId, role: 'assistant', content: '', sources: [] }])
    setIsTyping(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${id}/messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ role: 'user', content: query })
      })

      if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6)
            if (dataStr === '[DONE]') break
            
            try {
              const data = JSON.parse(dataStr)
              
              if (data.type === 'sources') {
                setMessages(prev => prev.map(msg => 
                  msg.id === tempAssistantId ? { ...msg, sources: data.sources, answer_type: data.answer_type } : msg
                ))
              } else if (data.type === 'token') {
                setMessages(prev => prev.map(msg => 
                  msg.id === tempAssistantId ? { ...msg, content: msg.content + data.text } : msg
                ))
              }
            } catch (e) {
              console.error("Error parsing SSE JSON", e)
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat streaming error:", error)
      setMessages(prev => prev.map(msg => 
        msg.id === tempAssistantId ? { ...msg, content: msg.content + "\n\n**Error:** Failed to connect to server." } : msg
      ))
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-container-lowest relative">
      {/* Top Bar */}
      <header className="h-16 px-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low shrink-0">
        <div>
          <h1 className="font-display font-semibold text-lg text-on-surface">
            {chat ? chat.title : 'Chat Workspace'}
          </h1>
          {chat?.description && (
            <p className="text-xs text-on-surface-variant truncate max-w-md">
              {chat.description}
            </p>
          )}
        </div>
      </header>

      {/* Main Content Area (Messages) */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <span className="material-symbols-outlined text-4xl mb-4 text-primary">chat</span>
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs mt-1">Ask a question or upload a document to get started.</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto flex flex-col pb-4">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                role={msg.role} 
                content={msg.content} 
                answer_type={msg.answer_type} 
                sources={msg.sources} 
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="w-full bg-surface-container-lowest pb-6 pt-2 shrink-0 border-t border-outline-variant/30">
        <ChatInput chatId={id} onSendMessage={handleSendMessage} disabled={isTyping} />
      </div>
    </div>
  )
}
