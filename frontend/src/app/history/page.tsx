'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '@/lib/supabase'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserMenu } from '@/components/layout/UserMenu'

type Chat = {
  id: string
  title: string
  description?: string | null
  summary?: string | null
  last_message_at?: string | null
  created_at?: string
  is_archived?: boolean
}

// Categorize chat into a topic badge based on title keywords
function getTopicBadge(title: string) {
  const t = title.toLowerCase()
  if (t.includes('econ') || t.includes('finance') || t.includes('market') || t.includes('money')) {
    return { label: 'Economics', bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800/60' }
  }
  if (t.includes('bio') || t.includes('cell') || t.includes('gene') || t.includes('med')) {
    return { label: 'Biology', bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800/60' }
  }
  if (t.includes('math') || t.includes('calc') || t.includes('algebra') || t.includes('stat')) {
    return { label: 'Mathematics', bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800/60' }
  }
  if (t.includes('chem') || t.includes('organic') || t.includes('atom')) {
    return { label: 'Chemistry', bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800/60' }
  }
  if (t.includes('phys') || t.includes('quantum') || t.includes('gravity')) {
    return { label: 'Physics', bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800/60' }
  }
  if (t.includes('code') || t.includes('python') || t.includes('software') || t.includes('data') || t.includes('algo')) {
    return { label: 'Computer Science', bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800/60' }
  }
  if (t.includes('hist') || t.includes('war') || t.includes('revolution')) {
    return { label: 'History', bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800/60' }
  }
  return { label: 'General Study', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' }
}

function formatRelativeDate(dateString?: string | null) {
  if (!dateString) return 'Recent'
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 2) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  } catch {
    return 'Recent'
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'newest' | 'alpha'>('recent')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [userName, setUserName] = useState('Rakshit')

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
      router.push(`/dashboard/chat/${data.id}`)
    },
    onError: (err) => {
      console.error('Failed to create chat:', err)
    }
  })

  const handleCreateNewChat = () => {
    createChatMutation.mutate()
  }

  // Auth guard and fetch current user details
  useEffect(() => {
    let mounted = true
    const checkSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        if (!session && !window.location.hash.includes('access_token')) {
          router.push('/login')
          return
        }
        if (session?.user) {
          const user = session.user
          if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name.split(' ')[0])
          } else if (user.email) {
            const namePart = user.email.split('@')[0]
            setUserName(namePart.charAt(0).toUpperCase() + namePart.slice(1))
          }
        }
      }
    }
    checkSession()
    return () => { mounted = false }
  }, [router])

  // Dynamic Query to fetch all real user chats
  const { data: chats, isLoading, refetch } = useQuery<Chat[]>({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/?limit=100`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      )
      return res.data as Chat[]
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${chatId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      )
      return chatId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
      setDeletingId(null)
    },
    onError: (err) => {
      console.error('Failed to delete chat:', err)
      setDeletingId(null)
    }
  })

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to permanently delete this study session?')) {
      setDeletingId(chatId)
      deleteMutation.mutate(chatId)
    }
  }

  // Filter & Sort Chats
  const filteredChats = useMemo(() => {
    if (!chats) return []

    return chats
      .filter((chat) => {
        // Search filter
        const q = searchQuery.toLowerCase().trim()
        const matchesQuery =
          !q ||
          chat.title.toLowerCase().includes(q) ||
          (chat.description && chat.description.toLowerCase().includes(q)) ||
          (chat.summary && chat.summary.toLowerCase().includes(q))

        if (!matchesQuery) return false

        // Time filter
        if (timeFilter === 'all') return true

        const dateToTest = new Date(chat.last_message_at || chat.created_at || 0)
        const now = new Date()
        const diffHours = (now.getTime() - dateToTest.getTime()) / (1000 * 60 * 60)

        if (timeFilter === 'today') return diffHours <= 24
        if (timeFilter === '7days') return diffHours <= 24 * 7
        if (timeFilter === '30days') return diffHours <= 24 * 30

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') {
          return a.title.localeCompare(b.title)
        }
        if (sortBy === 'newest') {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        }
        // default: 'recent'
        const dateA = new Date(a.last_message_at || a.created_at || 0).getTime()
        const dateB = new Date(b.last_message_at || b.created_at || 0).getTime()
        return dateB - dateA
      })
  }, [chats, searchQuery, timeFilter, sortBy])

  // Quick statistics
  const totalSessions = chats?.length || 0
  const activeThisWeek = useMemo(() => {
    if (!chats) return 0
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return chats.filter((c) => new Date(c.last_message_at || c.created_at || 0).getTime() > oneWeekAgo).length
  }, [chats])

  const userInitial = (userName || 'R').charAt(0).toUpperCase()

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main History View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative bg-gradient-to-br from-[#edf4fe] via-[#f2f6fe] to-[#f8faff] dark:from-slate-950 dark:via-[#090d16] dark:to-slate-950 custom-scroll selection:bg-emerald-500 selection:text-white">
        
        {/* Subtle Decorative Ambient Background Art */}
        <div className="fixed top-12 right-12 w-32 sm:w-36 z-0 hidden lg:block select-none pointer-events-none opacity-80 transition-opacity">
          <img 
            src="/settings_top_text.png" 
            alt="Study Inspiration" 
            className="w-full h-auto dark:hidden"
          />
          <img 
            src="/settings_top_text_dark.png" 
            alt="Study Inspiration" 
            className="w-full h-auto hidden dark:block"
          />
        </div>

        <div className="fixed bottom-0 right-0 w-[170px] lg:w-[190px] xl:w-[210px] 2xl:w-[230px] z-0 hidden xl:block select-none pointer-events-none opacity-90 transition-opacity">
          <img 
            src="/settings_books_seamless.png" 
            alt="Books and Plant" 
            className="w-full h-auto object-contain object-bottom-right dark:hidden"
          />
          <img 
            src="/settings_books_dark.png" 
            alt="Books and Plant" 
            className="w-full h-auto object-contain object-bottom-right hidden dark:block"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6">

          {/* Top Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Study History &amp; Past Sessions
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  {totalSessions} {totalSessions === 1 ? 'Session' : 'Sessions'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Review, search, and resume your academic conversations and research notes.
              </p>
            </div>

            {/* Right Controls: New Session Button + Back to Dashboard + Notification + Profile */}
            <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0 flex-wrap">
              <button
                onClick={handleCreateNewChat}
                disabled={createChatMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
              >
                {createChatMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
                <span>{createChatMutation.isPending ? 'Creating...' : 'New Session'}</span>
              </button>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-slate-700 transition-colors shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span>Dashboard</span>
              </Link>

              <UserMenu userName={userName} subtitle="Student" />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Sessions Card */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Sessions</span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{totalSessions}</p>
              </div>
            </div>

            {/* Active This Week */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active This Week</span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{activeThisWeek}</p>
              </div>
            </div>

            {/* AI Engine Status */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">AI Engine</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight mt-1">Study Tutor Active</p>
              </div>
            </div>
          </div>

          {/* Search, Time Filters & Sort Bar */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sessions by title, notes, or subject..."
                className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#059669] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Tabs & Sort Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Time Filter Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setTimeFilter('today')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeFilter === 'today'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeFilter('7days')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeFilter === '7days'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeFilter('30days')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    timeFilter === '30days'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                      : 'hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  30 Days
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none hover:bg-white dark:hover:bg-slate-750 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  <option value="recent">Recently Active</option>
                  <option value="newest">Newest Created</option>
                  <option value="alpha">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sessions List */}
          <div className="space-y-3 pb-16">
            
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-white/70 dark:bg-slate-900/70 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60 animate-pulse flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="w-24 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State: No chats exist at all */}
            {!isLoading && totalSessions === 0 && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-3xl p-10 border border-slate-200/80 dark:border-slate-800 shadow-xs text-center flex flex-col items-center justify-center max-w-md mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 flex items-center justify-center mb-4 shadow-inner">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No Study Sessions Yet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                  Start your first interactive study conversation with your AI partner to summarize lecture slides, solve problems, or prepare for exams.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={handleCreateNewChat}
                    disabled={createChatMutation.isPending}
                    className="px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    {createChatMutation.isPending ? 'Creating...' : 'Start First Session'}
                  </button>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}

            {/* Empty State: Search or Filter produced zero matches */}
            {!isLoading && totalSessions > 0 && filteredChats.length === 0 && (
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No matching sessions found</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                  We couldn&apos;t find any study session matching &ldquo;{searchQuery}&rdquo; within the selected time range.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setTimeFilter('all')
                  }}
                  className="mt-4 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-[#059669] dark:text-emerald-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* Dynamic Chat Items */}
            {!isLoading && filteredChats.map((chat) => {
              const badge = getTopicBadge(chat.title)
              const relativeTime = formatRelativeDate(chat.last_message_at || chat.created_at)
              const isDeleting = deletingId === chat.id

              return (
                <div
                  key={chat.id}
                  className="bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-850 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-200 group flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                >
                  {/* Left Section: Icon & Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Topic Badge Icon */}
                    <div className={`w-11 h-11 rounded-xl ${badge.bg} border ${badge.border} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
                      <svg className={`w-5 h-5 ${badge.text}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>

                    {/* Title and Excerpt */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/chat/${chat.id}`}
                          className="font-bold text-base text-slate-800 dark:text-slate-100 group-hover:text-[#059669] dark:group-hover:text-emerald-400 transition-colors truncate block"
                        >
                          {chat.title}
                        </Link>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {chat.description || chat.summary || 'Interactive AI study partner chat session with syllabus notes & reasoning.'}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Updated {relativeTime}
                        </span>
                        {chat.created_at && (
                          <span>• Created {new Date(chat.created_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-3 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0 shrink-0">
                    <Link
                      href={`/dashboard/chat/${chat.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-[#059669] dark:hover:bg-emerald-600 text-[#059669] dark:text-emerald-300 hover:text-white dark:hover:text-white text-xs font-bold transition-all shadow-2xs group/btn cursor-pointer"
                    >
                      <span>Resume Chat</span>
                      <svg className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </Link>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      disabled={isDeleting}
                      title="Delete this session"
                      className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 border border-transparent hover:border-red-100 dark:hover:border-red-900/40 transition-all cursor-pointer"
                    >
                      {isDeleting ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}

          </div>

        </div>
      </main>
    </div>
  )
}

