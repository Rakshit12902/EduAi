'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { data: chats, isLoading, refetch } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      return chatId
    },
    onSuccess: (deletedChatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      setDeletingChatId(null)
      if (pathname === `/dashboard/chat/${deletedChatId}`) {
        router.push('/dashboard')
      }
    },
    onError: (err) => {
      console.error('Failed to delete chat:', err)
      setDeletingChatId(null)
    }
  })

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat session?')) {
      setDeletingChatId(chatId)
      deleteMutation.mutate(chatId)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <>
      <div className={`${isCollapsed ? 'w-[72px]' : 'w-72'} border-r border-outline-variant bg-surface-container-lowest h-full flex flex-col transition-all duration-300 relative`}>
        
        {/* Header - Logo & Toggle */}
        <div className={`pt-6 pb-4 flex flex-col ${isCollapsed ? 'items-center' : 'px-4'} gap-4 shrink-0`}>
          {/* Logo Row */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 shrink-0 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
              </div>
              {!isCollapsed && <span className="font-display font-bold text-xl text-on-surface truncate">EduAI</span>}
            </div>
            
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(true)}
                className="w-8 h-8 flex shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                title="Collapse sidebar"
              >
                <span className="material-symbols-outlined text-[20px]">dock_to_left</span>
              </button>
            )}
          </div>

          {/* Toggle Button when collapsed */}
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 flex shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              title="Expand sidebar"
            >
              <span className="material-symbols-outlined text-[20px]">dock_to_right</span>
            </button>
          )}

          {/* Dashboard Link */}
          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest ${
              isCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2.5'
            } ${pathname === '/dashboard' ? 'text-primary bg-primary/10' : ''}`}
            title="Dashboard"
          >
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
            {!isCollapsed && <span className="text-sm font-medium">Dashboard</span>}
          </Link>
          
          {/* New Chat Button */}
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className={`flex items-center gap-3 rounded-[16px] transition-all bg-primary/10 text-primary hover:bg-primary/20 ${
              isCollapsed ? 'w-12 h-12 justify-center mx-auto' : 'w-full px-4 py-3'
            }`}
            title="New Chat Slot"
          >
            <span className="material-symbols-outlined text-[22px]">add_comment</span>
            {!isCollapsed && <span className="text-sm font-bold">New Chat</span>}
          </button>
        </div>

        {/* Separator */}
        <div className="px-4 py-2">
          <div className="h-[1px] w-full bg-outline-variant/50"></div>
        </div>

        {/* Chat List (History) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scroll">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">history</span>
              Recent Chats
            </div>
          )}
          
          {isLoading ? (
            <div className="py-4 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : chats?.length === 0 ? (
            !isCollapsed ? (
              <div className="px-3 py-4 text-sm text-on-surface-variant text-center opacity-60">
                No chats yet
              </div>
            ) : null
          ) : (
            chats?.map((chat) => {
              const isActive = pathname === `/dashboard/chat/${chat.id}`
              const isDeleting = deletingChatId === chat.id
              return (
                <div key={chat.id} className="group relative flex items-center justify-center">
                  <Link 
                    href={`/dashboard/chat/${chat.id}`}
                    title={isCollapsed ? chat.title : undefined}
                    className={`flex items-center gap-3 rounded-xl transition-colors overflow-hidden ${
                      isCollapsed ? 'justify-center w-10 h-10' : 'w-full px-3 py-2.5 pr-9'
                    } ${
                      isActive 
                        ? 'bg-secondary-container text-on-secondary-container font-medium' 
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[20px] shrink-0 ${isActive ? 'text-primary' : ''}`}>
                      chat_bubble
                    </span>
                    {!isCollapsed && <span className="truncate flex-1 text-sm">{chat.title}</span>}
                  </Link>

                  {!isCollapsed && (
                    <button
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      disabled={isDeleting}
                      title="Delete chat"
                      className="absolute right-2 p-1.5 rounded-md text-on-surface-variant/40 hover:text-error hover:bg-error-container/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      {isDeleting ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      )}
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t border-outline-variant shrink-0 flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
          <Link href="/settings" title="Settings" className={`flex items-center gap-3 rounded-xl transition-colors text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest ${isCollapsed ? 'justify-center w-10 h-10' : 'px-3 py-2.5'}`}>
            <span className="material-symbols-outlined text-[22px]">settings</span>
            {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
          <button onClick={handleLogout} title="Log out" className={`flex items-center gap-3 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-xl transition-colors ${isCollapsed ? 'justify-center w-10 h-10' : 'w-full px-3 py-2.5'}`}>
            <span className="material-symbols-outlined text-[22px]">logout</span>
            {!isCollapsed && <span className="text-sm font-medium">Log out</span>}
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
