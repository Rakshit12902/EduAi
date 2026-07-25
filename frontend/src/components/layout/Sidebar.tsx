'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { NewChatModal } from '../chat/NewChatModal'

type Chat = {
  id: string
  title: string
  last_message_at: string | null
}

export function Sidebar() {
  const pathname = usePathname()
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)

  const { data: chats, isLoading, refetch } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')
      
      const res = await axios.get('http://localhost:8000/api/v1/chats/', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      return res.data as Chat[]
    }
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div className="w-72 border-r border-outline-variant bg-surface-container-low h-full flex flex-col transition-all">
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-outline-variant shrink-0 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <span className="font-display font-semibold text-lg text-on-surface">EduAI</span>
          </div>
        </div>

        {/* Action button */}
        <div className="p-4">
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-xl hover:bg-primary/90 transition-colors shadow-sm font-medium"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            New Chat Slot
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            Your Chats
          </div>
          
          {isLoading ? (
            <div className="px-3 py-4 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : chats?.length === 0 ? (
            <div className="px-3 py-4 text-sm text-on-surface-variant text-center">
              No chats yet. Create one to get started!
            </div>
          ) : (
            chats?.map((chat) => {
              const isActive = pathname === `/dashboard/chat/${chat.id}`
              return (
                <Link 
                  key={chat.id} 
                  href={`/dashboard/chat/${chat.id}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-secondary-container text-on-secondary-container' 
                      : 'text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chat_bubble
                  </span>
                  <span className="truncate flex-1 text-sm font-medium">{chat.title}</span>
                </Link>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant shrink-0 space-y-1">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-container-highest rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container hover:text-on-error-container rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </div>

      <NewChatModal 
        isOpen={isNewChatModalOpen} 
        onClose={() => setIsNewChatModalOpen(false)} 
        onSuccess={refetch}
      />
    </>
  )
}
