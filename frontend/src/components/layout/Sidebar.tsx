'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useSidebar } from '@/components/layout/SidebarContext'

type Chat = {
  id: string
  title: string
  last_message_at?: string | null
  created_at?: string
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { activePalette, resolvedTheme } = useTheme()
  const { isMobileOpen, setIsMobileOpen, isCollapsed, setIsCollapsed } = useSidebar()
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')
      
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/`, 
        { title: 'New Chat' },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      setIsMobileOpen(false)
      router.push(`/dashboard/chat/${data.id}`)
    },
    onError: (err) => {
      console.error('Failed to create chat:', err)
    }
  })

  const handleCreateNewChat = () => {
    createChatMutation.mutate()
  }

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

  const renderSidebarBody = (isMobile: boolean = false) => {
    const collapsed = isMobile ? false : isCollapsed

    return (
      <div className="flex flex-col h-full overflow-hidden select-none">
        {/* Header - Logo & Toggle */}
        <div className={`pt-5 pb-3 flex flex-col ${collapsed ? 'items-center px-2' : 'px-4'} gap-4 shrink-0`}>
          {/* Logo Row */}
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full`}>
            <Link 
              href="/dashboard" 
              onClick={() => isMobile && setIsMobileOpen(false)}
              className="flex items-center gap-2.5 overflow-hidden group"
            >
              <div 
                className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                  color: activePalette.primary
                }}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                </svg>
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                    Edu<span style={{ color: activePalette.primary }}>AI</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium -mt-0.5">
                    Your AI Study Partner
                  </span>
                </div>
              )}
            </Link>
            
            {/* Desktop Collapse Toggle */}
            {!collapsed && !isMobile && (
              <button 
                onClick={() => setIsCollapsed(true)}
                className="w-7 h-7 flex shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 flex shrink-0 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Toggle Button when collapsed (desktop only) */}
          {collapsed && !isMobile && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-8 h-8 flex shrink-0 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Dashboard Link */}
          <Link 
            href="/dashboard"
            onClick={() => isMobile && setIsMobileOpen(false)}
            style={
              pathname === '/dashboard'
                ? {
                    backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                    color: activePalette.primary
                  }
                : {}
            }
            className={`flex items-center gap-3 rounded-xl transition-all ${
              collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3.5 py-2.5'
            } ${
              pathname === '/dashboard' 
                ? 'font-bold shadow-2xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
            }`}
            title="Dashboard"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            {!collapsed && <span className="text-sm">Dashboard</span>}
          </Link>
          
          {/* New Chat Button */}
          <button 
            onClick={handleCreateNewChat}
            disabled={createChatMutation.isPending}
            className={`flex items-center gap-3 rounded-xl transition-all border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 shadow-2xs active:scale-[0.98] cursor-pointer ${
              collapsed ? 'w-10 h-10 justify-center mx-auto' : 'w-full px-3.5 py-2.5'
            }`}
            title="New Chat"
          >
            {createChatMutation.isPending ? (
              <div className="w-5 h-5 shrink-0 border-2 border-slate-400 dark:border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
            {!collapsed && <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{createChatMutation.isPending ? 'Creating...' : 'New Chat'}</span>}
          </button>
        </div>

        {/* Separator */}
        <div className="px-4 py-1 shrink-0">
          <div className="h-[1px] w-full bg-slate-100 dark:bg-slate-800"></div>
        </div>

        {/* Chat List (History) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scroll">
          {/* All Past Sessions Link at Top */}
          {!collapsed && (
            <div className="pb-1 px-0.5">
              <Link 
                href="/history"
                onClick={() => isMobile && setIsMobileOpen(false)}
                style={
                  pathname === '/history'
                    ? {
                        backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                        borderColor: resolvedTheme === 'dark' ? activePalette.darkBorder : activePalette.border,
                        color: activePalette.primary
                      }
                    : {}
                }
                className={`flex items-center gap-2 text-xs font-semibold transition-all py-2 px-3 rounded-xl ${
                  pathname === '/history'
                    ? 'font-bold border shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800'
                }`}
              >
                <svg className="w-4 h-4 text-current shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>All Past Sessions</span>
                <span className="text-xs opacity-50 ml-0.5">→</span>
              </Link>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center pb-2">
              <Link 
                href="/history"
                title="All Past Sessions"
                style={
                  pathname === '/history'
                    ? {
                        backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                        borderColor: resolvedTheme === 'dark' ? activePalette.darkBorder : activePalette.border,
                        color: activePalette.primary
                      }
                    : {}
                }
                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                  pathname === '/history'
                    ? 'font-bold border shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </div>
          )}

          {!collapsed && (
            <div className="px-3 pt-1.5 pb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Recent Chats
            </div>
          )}
          
          {isLoading ? (
            <div className="py-4 flex justify-center">
              <div 
                className="animate-spin rounded-full h-5 w-5 border-b-2"
                style={{ borderColor: activePalette.primary }}
              ></div>
            </div>
          ) : chats?.length === 0 ? (
            !collapsed ? (
              <div className="px-3 py-4 text-xs text-slate-400 dark:text-slate-500 text-center">
                No chats yet
              </div>
            ) : null
          ) : (
            <>
              {chats?.map((chat) => {
                const isActive = pathname === `/dashboard/chat/${chat.id}`
                const isDeleting = deletingChatId === chat.id
                
                // Format relative time
                let relativeTime = 'Just now'
                const timestamp = chat.last_message_at || chat.created_at
                if (timestamp) {
                  const diffMs = Date.now() - new Date(timestamp).getTime()
                  const diffMins = Math.floor(diffMs / 60000)
                  if (diffMins < 5) relativeTime = 'Just now'
                  else if (diffMins < 60) relativeTime = `${diffMins} mins ago`
                  else {
                    const diffHours = Math.floor(diffMins / 60)
                    if (diffHours < 24) relativeTime = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
                    else {
                      const diffDays = Math.floor(diffHours / 24)
                      relativeTime = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
                    }
                  }
                }

                return (
                  <div key={chat.id} className="group relative flex items-center justify-center">
                    <Link 
                      href={`/dashboard/chat/${chat.id}`}
                      onClick={() => isMobile && setIsMobileOpen(false)}
                      title={collapsed ? chat.title : undefined}
                      style={
                        isActive
                          ? {
                              backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
                              borderColor: resolvedTheme === 'dark' ? activePalette.darkBorder : activePalette.border,
                              color: activePalette.primary
                            }
                          : {}
                      }
                      className={`flex items-center gap-3 rounded-xl transition-all ${
                        collapsed ? 'w-10 h-10 justify-center' : 'w-full px-3 py-2 text-left'
                      } ${
                        isActive 
                          ? 'font-semibold border shadow-2xs' 
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-800'
                      }`}
                    >
                      <svg 
                        className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-slate-400 dark:text-slate-500'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>

                      {!collapsed && (
                        <div className="flex flex-col min-w-0 flex-1 pr-6">
                          <span className="text-xs font-medium truncate text-slate-800 dark:text-slate-200">
                            {chat.title}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {relativeTime}
                          </span>
                        </div>
                      )}
                    </Link>

                    {!collapsed && (
                      <button
                        onClick={(e) => handleDeleteChat(e, chat.id)}
                        disabled={isDeleting}
                        title="Delete chat"
                        className={`absolute right-2 p-1.5 rounded-md transition-all cursor-pointer ${
                          isActive 
                            ? 'hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40' 
                            : 'text-slate-300 dark:text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 opacity-0 group-hover:opacity-100'
                        }`}
                        style={isActive ? { color: activePalette.primary } : {}}
                      >
                        {isDeleting ? (
                          <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Motivational Card */}
        {!collapsed && (
          <div 
            className="mx-3 my-2 p-3.5 rounded-2xl border relative overflow-hidden flex flex-col gap-1.5 shadow-2xs select-none transition-colors shrink-0"
            style={{
              backgroundColor: resolvedTheme === 'dark' ? activePalette.darkLight : activePalette.light,
              borderColor: resolvedTheme === 'dark' ? activePalette.darkBorder : activePalette.border
            }}
          >
            <div className="flex items-center justify-between" style={{ color: activePalette.primary }}>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
              <span className="text-[10px] opacity-70">✦</span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug pr-2">
              Small progress every day leads to big results.
            </p>
            <div 
              className="w-10 h-0.5 rounded-full mt-0.5"
              style={{ backgroundColor: activePalette.primary }}
            ></div>
          </div>
        )}

        {/* Footer */}
        <div className={`p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col gap-0.5 ${collapsed ? 'items-center' : ''}`}>
          <Link 
            href="/settings" 
            onClick={() => isMobile && setIsMobileOpen(false)}
            title="Settings" 
            className={`flex items-center gap-2.5 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            } ${collapsed ? 'justify-center w-10 h-10' : 'px-3 py-2'}`}
          >
            <svg className={`w-4 h-4 ${pathname === '/settings' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!collapsed && <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Settings</span>}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar: Hidden on Mobile (< md), Flex on Desktop */}
      <aside className={`hidden md:flex ${isCollapsed ? 'w-[72px]' : 'w-64'} border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex-col transition-all duration-300 relative select-none z-20 shrink-0`}>
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div 
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-50 flex flex-col transition-transform duration-300 ease-in-out md:hidden shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderSidebarBody(true)}
      </div>
    </>
  )
}
