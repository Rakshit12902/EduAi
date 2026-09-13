'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LandingPageProps {
  initialSection?: string
}

export default function LandingPage({ initialSection }: LandingPageProps = {}) {
  const [activeTab, setActiveTab] = useState('Home')
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState<'all' | 'rag' | 'workspaces' | 'ai' | 'security'>('all')
  const [activeModalMember, setActiveModalMember] = useState<'rakshit' | 'aashika' | null>(null)
  const [isModalClosing, setIsModalClosing] = useState(false)

  const openTeamModal = (id: 'rakshit' | 'aashika') => {
    setIsModalClosing(false)
    setActiveModalMember(id)
  }

  const closeTeamModal = () => {
    if (isModalClosing || !activeModalMember) return
    setIsModalClosing(true)
    setTimeout(() => {
      setActiveModalMember(null)
      setIsModalClosing(false)
    }, 220)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeModalMember && !isModalClosing) {
        closeTeamModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModalMember, isModalClosing])

  useEffect(() => {
    if (activeModalMember || videoModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeModalMember, videoModalOpen])

  const teamData = {
    rakshit: {
      name: 'Rakshit Katiyar',
      role: 'Project Lead & AI Engineer',
      image: '/images/team-rakshit.png',
      bio: "Passionate about AI, data, and building intelligent solutions that make learning simpler and more accessible.",
      fullBio: "AI engineer and system architect with a focus on building scalable, intelligent solutions for education. Experienced in designing RAG systems, vector databases, and multi-LLM architectures to enhance learning experiences.",
      tags: ['AI & Deep Learning', 'System Architecture', 'EdTech Innovation'],
      linkedin: 'https://www.linkedin.com/in/rakshit-katiyar-7738432a9/',
      email: 'rakshitkatiyar9@gmail.com'
    },
    aashika: {
      name: 'Aashika kumari',
      role: 'Product & UX Lead',
      image: '/images/team-aashika.png',
      bio: 'Passionate about transforming ideas into simple, intuitive experiences that make learning more engaging and accessible.',
      fullBio: 'Building learner-first experiences that make technology easier to use and learning more engaging. Focused on creating thoughtful, accessible, and human-centered experiences through EduAI.',
      tags: ['Product Strategy', 'UI/UX Design', 'Learner Experience'],
      linkedin: 'https://www.linkedin.com/in/aashika-kumari-999b222a9/',
      email: 'aashikasharma919@gmail.com'
    }
  }

  const navItems = ['Home', 'Features', 'How It Works', 'Use Cases', 'FAQ', 'About']

  const routeMap: Record<string, string> = {
    'Home': '/',
    'Features': '/features',
    'How It Works': '/how-it-works',
    'Use Cases': '/use-cases',
    'FAQ': '/faq',
    'About': '/about'
  }

  useEffect(() => {
    // If an initial section or hash is provided, scroll smoothly to that section on mount
    const currentPath = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '') : ''
    const hash = typeof window !== 'undefined' ? window.location.hash.split('#').filter(Boolean).pop() : undefined
    const targetSection = initialSection || hash || currentPath

    if (targetSection && targetSection !== 'home') {
      const el = document.getElementById(targetSection)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' })
        }, 150)
      }
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }

    const sectionIds = [
      { id: 'home', name: 'Home' },
      { id: 'features', name: 'Features' },
      { id: 'how-it-works', name: 'How It Works' },
      { id: 'use-cases', name: 'Use Cases' },
      { id: 'faq', name: 'FAQ' },
      { id: 'about', name: 'About' },
    ]

    const handleScroll = () => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }

      const scrollPosition = window.scrollY + 180

      let currentSection = 'Home'
      if (window.scrollY < 100) {
        currentSection = 'Home'
      } else {
        for (const section of sectionIds) {
          const el = document.getElementById(section.id)
          if (el) {
            const top = el.offsetTop
            if (scrollPosition >= top) {
              currentSection = section.name
            }
          }
        }
      }
      setActiveTab(currentSection)

      const targetPath = routeMap[currentSection] || '/'
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [initialSection])

  const detailedFeatures = [
    {
      category: 'rag',
      icon: 'description',
      title: 'Chat with Your Documents',
      subtitle: 'Document-Grounded RAG Engine',
      description: 'Upload textbooks, lecture slides, research papers, and notes. Ask questions and get clear, instant answers grounded strictly in your uploaded materials.',
      highlights: [
        'Supports PDF, DOCX, PPTX, TXT, MD, and Images',
        'Automatic document chunking via LangChain Text Splitters',
        '3072-dimensional vector embeddings powered by Google Gemini',
        'Sub-millisecond similarity search using Qdrant Cloud'
      ],
      badgeBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      iconBg: 'bg-indigo-100 text-indigo-600'
    },
    {
      category: 'workspaces',
      icon: 'layers',
      title: 'Multiple Chat Spaces',
      subtitle: 'Organized Subject Workspaces',
      description: 'Create separate workspaces for every course or research topic (e.g. Computer Networks, Organic Chemistry, World History) with dedicated document attachments.',
      highlights: [
        'Unlimited custom workspace creation',
        'Auto-generated chat titles from initial questions',
        'Independent document indexing per workspace',
        'Complete workspace history persistence'
      ],
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      iconBg: 'bg-emerald-100 text-emerald-600'
    },
    {
      category: 'rag',
      icon: 'fact_check',
      title: 'Verifiable Source Citations',
      subtitle: 'Zero-Hallucination Assurance',
      description: 'Every answer is backed by verified source badges displaying exact document filenames, page numbers, match relevance scores, and interactive text excerpt popups.',
      highlights: [
        '🟢 "Grounded in your documents" confidence badge',
        '🟡 "General Knowledge" fallback badge',
        'Interactive page & match percentage pills',
        'One-click text snippet popover viewer'
      ],
      badgeBg: 'bg-purple-50 text-purple-600 border-purple-100',
      iconBg: 'bg-purple-100 text-purple-600'
    },
    {
      category: 'ai',
      icon: 'bolt',
      title: 'Dual-LLM High Availability',
      subtitle: 'Sub-Second Response Streaming',
      description: 'Powered by ultra-fast Groq LPU hardware with seamless, automatic fallback to Google Gemini 2.0 Flash for 100% uptime reliability.',
      highlights: [
        'Groq LPU (Qwen 3.6 27B / GPT-OSS 120B)',
        'Google Gemini 2.0 Flash automatic fallback',
        'Server-Sent Events (SSE) token-by-token streaming',
        'ThinkFilter parser for reasoning model tags'
      ],
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-100',
      iconBg: 'bg-amber-100 text-amber-600'
    },
    {
      category: 'ai',
      icon: 'tune',
      title: 'Custom AI Models & Parameters',
      subtitle: 'Full Model Control',
      description: 'Adjust creativity temperature, maximum token lengths, response languages (English, Hindi, Spanish, French, German), and AI engine models.',
      highlights: [
        'Temperature slider (0.0 to 1.0)',
        'Multi-lingual output target selector',
        'Model choice switcher',
        'Message action bar (Copy, Edit, Regenerate, Rate)'
      ],
      badgeBg: 'bg-rose-50 text-rose-600 border-rose-100',
      iconBg: 'bg-rose-100 text-rose-600'
    },
    {
      category: 'security',
      icon: 'lock',
      title: 'Your Data Stays Yours',
      subtitle: 'Enterprise-Grade Security',
      description: 'Multi-tenant database isolation at the PostgreSQL and Qdrant metadata levels ensures your private study files are never exposed or used to train public models.',
      highlights: [
        'Supabase JWT Authentication & Row-Level Security',
        'AWS S3 encrypted file storage',
        'Isolated Qdrant vector payload filters by User ID',
        'Zero public training on user materials'
      ],
      badgeBg: 'bg-sky-50 text-sky-600 border-sky-100',
      iconBg: 'bg-sky-100 text-sky-600'
    }
  ]

  const filteredFeatures = selectedFeatureCategory === 'all'
    ? detailedFeatures
    : detailedFeatures.filter(f => f.category === selectedFeatureCategory)

  const faqs = [
    {
      q: 'How does EduAI extract answers from my documents?',
      a: 'EduAI uses Retrieval-Augmented Generation (RAG). When you upload a PDF or text file, it chunks the document into vector embeddings using Qdrant. When you ask a question, EduAI retrieves only the relevant passages and generates a precise answer with page citations.'
    },
    {
      q: 'What file formats are supported?',
      a: 'EduAI supports PDF (.pdf), Microsoft Word (.docx), PowerPoint (.pptx), Markdown (.md), Plain Text (.txt), and Images (PNG, JPG, WEBP).'
    },
    {
      q: 'Is my study data secure and private?',
      a: 'Yes, absolutely. All uploaded documents are isolated by your user account and chat workspace. We never use your private study materials to train public AI models.'
    },
    {
      q: 'Can I organize chats by subjects or courses?',
      a: 'Yes! You can create unlimited dedicated chat spaces for different subjects (e.g., Computer Networks, Biology, Calculus) with specific document attachments.'
    },
    {
      q: 'Is EduAI free to get started?',
      a: 'EduAI is free to get started with generous document processing and chat query quotas. Upgrade options are available for heavy research workloads.'
    }
  ]

  const handleNavClick = (item: string) => {
    setActiveTab(item)
    const targetPath = routeMap[item] || '/'
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath)
    }
    if (item === 'Home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const anchor = item.toLowerCase().replace(/\s+/g, '-')
      const element = document.getElementById(anchor)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] text-slate-800 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-clip">
      
      {/* Background Subtle Gradient Glows (Seamless full-page blend) */}
      <div className="absolute inset-0 w-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-80px] left-[-80px] w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/45 via-purple-100/35 to-blue-200/25 rounded-full blur-3xl" />
        <div className="absolute top-[80px] right-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-blue-200/40 via-indigo-100/35 to-pink-100/30 rounded-full blur-3xl" />
        <div className="absolute top-[1200px] left-[-120px] w-[550px] h-[550px] bg-gradient-to-tr from-purple-100/35 via-indigo-100/30 to-blue-100/25 rounded-full blur-3xl" />
        <div className="absolute top-[2200px] right-[-100px] w-[550px] h-[550px] bg-gradient-to-br from-blue-100/35 via-indigo-100/30 to-purple-100/25 rounded-full blur-3xl" />
        <div className="absolute top-[3400px] left-[-100px] w-[550px] h-[550px] bg-gradient-to-tr from-indigo-100/35 via-purple-100/30 to-blue-100/25 rounded-full blur-3xl" />
        <div className="absolute top-[4400px] right-[-100px] w-[550px] h-[550px] bg-gradient-to-br from-purple-100/35 via-blue-100/30 to-indigo-100/25 rounded-full blur-3xl" />
      </div>

      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#f5f8ff]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg className="w-9 h-8 shrink-0 transform group-hover:scale-105 transition-transform" viewBox="0 0 36 28" fill="none">
              <path d="M17 5.5C12.5 3.5 5.5 3.5 1 5.5V23.5C5.5 21.5 12.5 21.5 17 23.5V5.5Z" fill="#4F46E5" />
              <path d="M19 5.5C23.5 3.5 30.5 3.5 35 5.5V23.5C30.5 21.5 23.5 21.5 19 23.5V5.5Z" fill="#6366F1" opacity="0.9" />
            </svg>
            <div>
              <span className="font-headline-lg text-2xl font-extrabold text-slate-900 tracking-tight block leading-none">
                EduAI
              </span>
              <span className="block text-[11px] font-semibold text-slate-400 tracking-wide mt-0.5">
                Your Learning Companion
              </span>
            </div>
          </Link>

          {/* Navigation Items (Integrated Single-Page Scroll Pills) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1.5 rounded-full border border-slate-200/70 shadow-xs">
            {navItems.map((item) => {
              const isActive = activeTab === item
              return (
                <button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all"
            >
              Log in
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="home" className="relative z-10 pt-10 pb-16 md:pt-14 md:pb-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide shadow-2xs">
                <svg className="w-3.5 h-3.5 text-indigo-500 fill-current animate-pulse shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                <span>AI-Powered Learning Assistant</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline-lg font-black text-slate-900 tracking-tight leading-[1.12]">
                Turn Your Documents into{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  Conversations
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-base sm:text-lg text-slate-500 font-normal leading-relaxed max-w-xl">
                Upload your study materials, ask questions, and get clear, accurate answers — all in one place. Your personal AI teaching assistant, anytime, anywhere.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="px-7 py-3.5 rounded-full text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all flex items-center gap-2 group"
                >
                  <span>Get Started Free</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>

                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="px-6 py-3.5 rounded-full text-base font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-2xs flex items-center gap-2.5 transition-all hover:-translate-y-0.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span>Watch Demo</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-slate-600 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                    </svg>
                  </div>
                  <span>Designed for Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4z"/>
                    </svg>
                  </div>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                    </svg>
                  </div>
                  <span>Free to Get Started</span>
                </div>
              </div>

            </div>

            {/* Right Graphic Preview & Doodles */}
            <div className="lg:col-span-6 relative">
              
              {/* Top Handwritten Doodle Note */}
              <div className="absolute -top-12 left-10 z-20 pointer-events-none hidden sm:flex flex-col items-start">
                <div className="font-serif italic text-indigo-600 text-xs font-bold -rotate-6 bg-indigo-100/70 px-3 py-1.5 rounded-xl border border-indigo-200/80 shadow-xs">
                  Upload • Learn • Ask • Grow
                </div>
                <svg className="w-8 h-8 text-indigo-400 mt-0.5 ml-6 transform -rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              {/* Floating Document Type Badges */}
              <div className="absolute left-[-15px] sm:left-[-30px] top-1/4 z-30 flex flex-col gap-3 pointer-events-none">
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-rose-100 flex items-center gap-1.5 text-xs font-extrabold text-rose-600 transform -rotate-6 animate-bounce" style={{ animationDuration: '3s' }}>
                  <span className="w-5 h-5 rounded-md bg-rose-500 text-white flex items-center justify-center text-[10px] font-black">PDF</span>
                  <span>PDF</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-blue-100 flex items-center gap-1.5 text-xs font-extrabold text-blue-600 transform rotate-3">
                  <span className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-black">DOC</span>
                  <span>DOC</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-emerald-100 flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 transform -rotate-3">
                  <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">PPT</span>
                  <span>PPT</span>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-lg border border-slate-100 flex items-center gap-1.5 text-xs font-extrabold text-slate-600 transform rotate-6">
                  <span className="w-5 h-5 rounded-md bg-slate-400 text-white flex items-center justify-center text-[10px] font-black">TXT</span>
                  <span>TXT</span>
                </div>
              </div>

              {/* Main Mockup UI Card Container */}
              <div className="bg-gradient-to-b from-indigo-100/70 via-purple-100/50 to-indigo-50/30 p-4 sm:p-6 rounded-3xl border border-indigo-200/60 shadow-2xl relative">
                
                {/* Chat Mockup Window */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-100 space-y-4">
                  
                  {/* Window Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.35-.75-2.5-1z"/>
                        </svg>
                      </div>
                      <span className="font-extrabold text-slate-800 text-sm">EduAI Workspace</span>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="space-y-3.5 text-xs sm:text-sm">
                    
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-950 px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[85%] font-semibold shadow-2xs">
                        Can you explain this concept in simple terms?
                      </div>
                    </div>

                    {/* AI Answer */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.35-.75-2.5-1z"/>
                        </svg>
                      </div>
                      <div className="bg-slate-50 border border-slate-200/70 text-slate-800 p-3.5 rounded-2xl rounded-tl-xs space-y-2.5 w-full">
                        <p className="font-semibold text-xs sm:text-sm leading-relaxed text-slate-800">
                          Of course! Here&apos;s a simple explanation based on your document...
                        </p>
                        
                        <div className="space-y-1.5 opacity-40">
                          <div className="h-1.5 bg-slate-400 rounded-full w-full" />
                          <div className="h-1.5 bg-slate-400 rounded-full w-4/5" />
                        </div>

                        {/* Citations Badges */}
                        <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sources:</span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Chapter 3.pdf
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Notes.docx
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Lecture Slides.pptx
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Input Mockup */}
                  <div className="pt-1">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-slate-400 shadow-2xs">
                      <span>Ask anything about your documents...</span>
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Handwritten Doodle Annotations */}
              <div className="absolute -bottom-10 right-0 z-20 pointer-events-none hidden sm:flex flex-col items-end">
                <div className="font-serif italic text-indigo-600 text-xs font-bold rotate-3 bg-indigo-100/70 px-3.5 py-1.5 rounded-xl border border-indigo-200/80 shadow-xs inline-block">
                  Your Documents + AI = Better Learning
                </div>
                <div className="font-serif italic text-purple-600 text-xs font-bold mt-1 pr-2">
                  Smarter Students • Brighter Futures ⤵
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* WHY EDUAI / FEATURES SECTION ("A Smarter Way to Learn") */}
      <section id="features" className="py-24 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-extrabold tracking-wider uppercase">
              WHY EDUAI
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline-lg font-extrabold text-slate-900 tracking-tight">
              A Smarter Way to Learn
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Save time, understand concepts better, and make your study journey easier with AI.
            </p>
          </div>

          {/* Handwritten Doodle Note */}
          <div className="absolute top-36 right-0 z-20 pointer-events-none hidden xl:flex flex-col items-end">
            <div className="font-serif italic text-purple-600 text-sm font-bold rotate-6 bg-purple-100/80 px-4 py-2 rounded-2xl border border-purple-200/80 shadow-xs">
              Learn Smarter Everyday ⤵
            </div>
          </div>

          {/* 4 Pastel Feature Cards (Reference Design) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 - Purple */}
            <div className="p-7 rounded-3xl bg-indigo-50/70 border border-indigo-100/90 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-200/50 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Chat with Your Documents</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Get instant, accurate answers from your uploaded study materials with page citations.
              </p>
            </div>

            {/* Card 2 - Mint/Green */}
            <div className="p-7 rounded-3xl bg-emerald-50/70 border border-emerald-100/90 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200/50 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Multiple Chat Spaces</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Keep different subjects, courses, and document collections organized cleanly.
              </p>
            </div>

            {/* Card 3 - Pink */}
            <div className="p-7 rounded-3xl bg-pink-50/70 border border-pink-100/90 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center border border-pink-200/50 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-pink-600 transition-colors">Built for Students</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Simple, clean, and distraction-free interface focused purely on your learning goals.
              </p>
            </div>

            {/* Card 4 - Blue */}
            <div className="p-7 rounded-3xl bg-sky-50/70 border border-sky-100/90 hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center border border-sky-200/50 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors">Your Data Stays Yours</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Secure, private, and isolated chat environments. We respect your study privacy.
              </p>
            </div>

          </div>

          {/* Extended Feature Deep Dive Grid */}
          <div className="pt-12 border-t border-slate-200/60 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Deep-Dive Capabilities</h3>
                <p className="text-xs sm:text-sm text-slate-500">Explore advanced RAG vector search, dual-LLM streaming, and security parameters.</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Capabilities' },
                  { id: 'rag', label: 'Document RAG' },
                  { id: 'workspaces', label: 'Workspaces' },
                  { id: 'ai', label: 'Dual-LLM Engine' },
                  { id: 'security', label: 'Security & Privacy' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFeatureCategory(cat.id as any)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedFeatureCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feat, idx) => (
                <div
                  key={idx}
                  className="group bg-white/90 backdrop-blur-md rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between relative overflow-hidden space-y-4 cursor-pointer"
                >
                  {/* Soft Ambient Hover Glow Overlay */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-100/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${feat.iconBg} flex items-center justify-center border border-white/80 shadow-xs group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          {feat.icon === 'description' && <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>}
                          {feat.icon === 'layers' && <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>}
                          {feat.icon === 'fact_check' && <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-9 14l-4-4 1.41-1.41L11 13.17l7.59-7.59L20 7l-9 9z"/>}
                          {feat.icon === 'bolt' && <path d="M7 2v11h3v9l7-12h-4l4-8z"/>}
                          {feat.icon === 'tune' && <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>}
                          {feat.icon === 'lock' && <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>}
                        </svg>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${feat.badgeBg} group-hover:scale-105 transition-transform`}>
                        {feat.subtitle}
                      </span>
                    </div>

                    <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{feat.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed font-normal">{feat.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100/80 space-y-3 relative z-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">KEY HIGHLIGHTS</span>
                    <ul className="space-y-2">
                      {feat.highlights.map((h, i) => (
                        <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-2.5 group-hover:translate-x-1 transition-transform">
                          <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                            ✓
                          </span>
                          <span className="leading-snug">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 relative">
            
            {/* Top Left Doodle Note */}
            <div className="absolute top-0 left-[-60px] z-20 pointer-events-none hidden xl:flex flex-col items-start text-left">
              <div className="font-serif italic text-indigo-600 text-xs font-bold -rotate-6 bg-indigo-100/80 px-3.5 py-2 rounded-xl border border-indigo-200/80 shadow-2xs leading-relaxed">
                Upload<br />
                Learn<br />
                Understand<br />
                Grow ⤵
              </div>
            </div>

            {/* Top Right Doodle Note */}
            <div className="absolute top-0 right-[-60px] z-20 pointer-events-none hidden xl:flex flex-col items-end text-right">
              <div className="font-serif italic text-indigo-600 text-xs font-bold rotate-6 bg-indigo-100/80 px-3.5 py-2 rounded-xl border border-indigo-200/80 shadow-2xs leading-relaxed">
                Your<br />
                Knowledge<br />
                Always<br />
                With You ⤵
              </div>
            </div>

            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide uppercase">
              Simple Steps. Big Learning Outcomes.
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline-lg font-extrabold text-slate-900 tracking-tight">
              How{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                EduAI
              </span>{' '}
              Works
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              From your documents to clear answers — in just a few simple steps.
            </p>
          </div>

          {/* 4 STEP PROCESS CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Dashed SVG Arrow Connectors (Desktop) */}
            <div className="hidden lg:block absolute top-[120px] left-[23%] z-20 pointer-events-none">
              <svg className="w-16 h-8 text-indigo-300 fill-none" viewBox="0 0 60 30">
                <path d="M5 15 Q 30 5, 55 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M50 10 L 56 15 L 49 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="hidden lg:block absolute top-[120px] left-[48%] z-20 pointer-events-none">
              <svg className="w-16 h-8 text-indigo-300 fill-none" viewBox="0 0 60 30">
                <path d="M5 15 Q 30 25, 55 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M50 10 L 56 15 L 49 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="hidden lg:block absolute top-[120px] left-[73%] z-20 pointer-events-none">
              <svg className="w-16 h-8 text-indigo-300 fill-none" viewBox="0 0 60 30">
                <path d="M5 15 Q 30 5, 55 15" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M50 10 L 56 15 L 49 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* CARD 1: STEP 1 - UPLOAD YOUR DOCUMENTS */}
            <div className="bg-[#f4f7ff] border border-blue-100/90 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 relative group">
              
              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  1
                </div>

                <div className="bg-gradient-to-b from-blue-50/80 to-white/90 rounded-xl p-5 border border-blue-100/70 relative h-36 flex items-center justify-center overflow-hidden">
                  <div className="absolute top-4 left-4 bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs -rotate-6">
                    PDF
                  </div>
                  <div className="absolute bottom-5 left-6 bg-blue-500 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs rotate-3">
                    DOC
                  </div>
                  <div className="absolute bottom-4 right-6 bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-2xs -rotate-3">
                    PPT
                  </div>

                  <div className="w-16 h-16 rounded-full bg-white shadow-md border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                    Upload Your Documents
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Add your study materials (PDFs, notes, slides, or text files) to your personal workspace.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 border border-blue-100 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500 shrink-0 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Supports PDF, DOC, PPT, TXT and more</span>
              </div>

            </div>

            {/* CARD 2: STEP 2 - ASK YOUR QUESTIONS */}
            <div className="bg-[#faf7ff] border border-purple-100/90 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 relative group">
              
              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  2
                </div>

                <div className="bg-gradient-to-b from-purple-50/80 to-white/90 rounded-xl p-3 border border-purple-100/70 relative h-36 flex flex-col justify-center gap-2 overflow-hidden">
                  <div className="self-end bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tr-xs px-3 py-1.5 text-[11px] text-slate-700 font-medium max-w-[85%] shadow-2xs flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">U</div>
                    <span>Can you explain this concept?</span>
                  </div>

                  <div className="self-start bg-white border border-slate-200/80 rounded-2xl rounded-tl-xs px-3 py-1.5 text-[11px] text-slate-700 font-medium shadow-2xs flex items-center gap-2">
                    <svg className="w-4 h-3 shrink-0" viewBox="0 0 36 28" fill="none">
                      <path d="M17 5.5C12.5 3.5 5.5 3.5 1 5.5V23.5C5.5 21.5 12.5 21.5 17 23.5V5.5Z" fill="#4F46E5" />
                      <path d="M19 5.5C23.5 3.5 30.5 3.5 35 5.5V23.5C30.5 21.5 23.5 21.5 19 23.5V5.5Z" fill="#6366F1" opacity="0.9" />
                    </svg>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-100"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse delay-200"></span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-indigo-600 transition-colors">
                    Ask Your Questions
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Type your questions in natural language. You can ask anything related to your documents.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 border border-purple-100 rounded-xl px-3 py-2 text-xs font-medium text-purple-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-500 shrink-0 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Ask, explore, and learn freely</span>
              </div>

            </div>

            {/* CARD 3: STEP 3 - AI FINDS RELEVANT INFORMATION */}
            <div className="bg-[#f4fbf7] border border-emerald-100/90 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 relative group">
              
              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  3
                </div>

                <div className="bg-gradient-to-b from-emerald-50/80 to-white/90 rounded-xl p-4 border border-emerald-100/70 relative h-36 flex items-center justify-center overflow-hidden">
                  <div className="bg-white rounded-lg p-3 border border-emerald-100 shadow-xs w-full max-w-[85%] space-y-2 relative">
                    <div className="h-2 w-3/4 bg-emerald-200/70 rounded"></div>
                    <div className="h-2 w-full bg-emerald-100/60 rounded"></div>
                    <div className="h-2 w-5/6 bg-emerald-100/60 rounded"></div>
                    
                    <div className="absolute right-2 bottom-1 w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-emerald-600 transition-colors">
                    AI Finds Relevant Information
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    EduAI searches through your documents, finds the most relevant content, and uses advanced AI to generate accurate answers.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 border border-emerald-100 rounded-xl px-3 py-2 text-xs font-medium text-emerald-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600 shrink-0 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Powered by RAG for reliable answers</span>
              </div>

            </div>

            {/* CARD 4: STEP 4 - GET CLEAR ANSWERS WITH SOURCES */}
            <div className="bg-[#fff5f8] border border-pink-100/90 rounded-2xl p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-6 relative group">
              
              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-pink-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  4
                </div>

                <div className="bg-gradient-to-b from-pink-50/80 to-white/90 rounded-xl p-3 border border-pink-100/70 relative h-36 flex flex-col justify-center gap-2 overflow-hidden">
                  <div className="bg-white rounded-lg p-2.5 border border-pink-100/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-3 shrink-0" viewBox="0 0 36 28" fill="none">
                        <path d="M17 5.5C12.5 3.5 5.5 3.5 1 5.5V23.5C5.5 21.5 12.5 21.5 17 23.5V5.5Z" fill="#4F46E5" />
                        <path d="M19 5.5C23.5 3.5 30.5 3.5 35 5.5V23.5C30.5 21.5 23.5 21.5 19 23.5V5.5Z" fill="#6366F1" opacity="0.9" />
                      </svg>
                      <div className="h-1.5 w-1/2 bg-slate-300 rounded"></div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded"></div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 block">Sources:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-red-50 border border-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Chapter 3.pdf
                      </span>
                      <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Notes.docx
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-pink-600 transition-colors">
                    Get Clear Answers with Sources
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Receive easy-to-understand answers with references from your documents, so you can always verify the information.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 border border-pink-100 rounded-xl px-3 py-2 text-xs font-medium text-pink-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-pink-500 shrink-0 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Transparent, accurate, and trustworthy</span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* USE CASES SECTION */}
      <section id="use-cases" className="py-24 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
              Real People. Real Learning.
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline-lg font-extrabold text-slate-900 tracking-tight">
              Explore Use Cases
            </h2>
            <p className="text-base text-slate-500">
              See how EduAI makes a difference in various learning journeys.
            </p>
          </div>

          {/* 6 Pastel Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: College Students */}
            <div className="rounded-3xl p-6 border bg-[#f4f7ff] border-blue-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100/80 text-blue-600 font-bold text-xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      🎓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-blue-600 transition-colors">College Students</h3>
                    <p className="text-xs font-medium text-slate-500">Study smarter. Perform better.</p>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {['Understand complex concepts', 'Prepare for exams', 'Summarize lecture notes', 'Get instant doubt resolution'].map((b, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-32 sm:w-36 h-36 sm:h-40 relative shrink-0 flex items-end justify-center self-end">
                  <img
                    src="/images/role-students.jpg"
                    alt="College Students Illustration"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Educators */}
            <div className="rounded-3xl p-6 border bg-[#faf7ff] border-purple-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-purple-100/80 text-purple-600 font-bold text-xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      👩‍🏫
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-purple-600 transition-colors">Educators</h3>
                    <p className="text-xs font-medium text-slate-500">Teach with the power of AI.</p>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {['Create study materials', 'Generate explanations', 'Find real-world examples', 'Support diverse learning styles'].map((b, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-32 sm:w-36 h-36 sm:h-40 relative shrink-0 flex items-end justify-center self-end">
                  <img
                    src="/images/role-educator.jpg"
                    alt="Educators Illustration"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Self Learners */}
            <div className="rounded-3xl p-6 border bg-[#fff5f8] border-pink-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-pink-100/80 text-pink-600 font-bold text-xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      📖
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-pink-600 transition-colors">Self Learners</h3>
                    <p className="text-xs font-medium text-slate-500">Explore. Ask. Learn anything.</p>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {['Learn at your own pace', 'Dive deep into new topics', 'Get simplified explanations', 'Build your knowledge library'].map((b, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-32 sm:w-36 h-36 sm:h-40 relative shrink-0 flex items-end justify-center self-end">
                  <img
                    src="/images/role-self-learner.jpg"
                    alt="Self Learners Illustration"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Competitive Exam Aspirants */}
            <div className="rounded-3xl p-6 border bg-[#f4fbf7] border-emerald-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100/80 text-emerald-600 font-bold text-xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      📊
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-emerald-600 transition-colors">Competitive Aspirants</h3>
                    <p className="text-xs font-medium text-slate-500">Focus. Practice. Improve.</p>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {['Clarify difficult topics', 'Solve doubts with sources', 'Get topic-wise explanations', 'Strengthen weak areas'].map((b, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-32 sm:w-36 h-36 sm:h-40 relative shrink-0 flex items-end justify-center self-end">
                  <img
                    src="/images/role-aspirant.jpg"
                    alt="Competitive Aspirants Illustration"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Card 5: Professionals */}
            <div className="rounded-3xl p-6 border bg-[#f0f7ff] border-sky-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100/80 text-sky-600 font-bold text-xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      💼
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-sky-600 transition-colors">Professionals</h3>
                    <p className="text-xs font-medium text-slate-500">Upskill. Stay ahead.</p>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {['Learn new tools & concepts', 'Understand tech docs', 'Get quick, reliable answers', 'Save time with summaries'].map((b, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-32 sm:w-36 h-36 sm:h-40 relative shrink-0 flex items-end justify-center self-end">
                  <img
                    src="/images/role-professional.jpg"
                    alt="Professionals Illustration"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

            {/* Card 6: Lifelong Learners */}
            <div className="rounded-3xl p-6 border bg-[#fffbf0] border-amber-100/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 z-10">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100/80 text-amber-600 font-bold text-xl flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                      💡
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-0.5 group-hover:text-amber-600 transition-colors">Lifelong Learners</h3>
                    <p className="text-xs font-medium text-slate-500">Because learning never stops.</p>
                  </div>
                  <ul className="space-y-2 pt-1">
                    {['Explore new interests', 'Learn anytime, anywhere', 'Get simple, clear explanations', 'Stay curious and keep growing'].map((b, i) => (
                      <li key={i} className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 text-[10px] font-bold">✓</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="w-32 sm:w-36 h-36 sm:h-40 relative shrink-0 flex items-end justify-center self-end">
                  <img
                    src="/images/role-lifelong.jpg"
                    alt="Lifelong Learners Illustration"
                    className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline-lg font-extrabold text-slate-900 tracking-tight">
              Got Questions?{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                We&apos;ve Got Answers.
              </span>
            </h2>
            <p className="text-base text-slate-500">
              Find answers to common questions about EduAI. Can&apos;t find what you&apos;re looking for? We&apos;re always here to help.
            </p>
          </div>

          {/* Search & Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left FAQ Accordion List */}
            <div className="lg:col-span-8 space-y-3.5">
              {[
                { q: 'What is EduAI?', a: 'EduAI is an AI-powered learning assistant that helps you understand your study materials. You can upload PDFs, notes, slides, or other documents and ask questions to get clear, accurate answers with source references.', icon: '📖', iconBg: 'bg-indigo-100 text-indigo-600' },
                { q: 'What types of documents can I upload?', a: 'You can upload PDF files, Microsoft Word documents (.docx), PowerPoint presentations (.pptx), plain text files (.txt), and Markdown notes.', icon: '📄', iconBg: 'bg-blue-100 text-blue-600' },
                { q: 'Is my data safe and private?', a: 'Yes, absolutely. Your uploaded documents and chat history are isolated strictly to your account. We never use your private study materials to train public AI models.', icon: '🛡️', iconBg: 'bg-indigo-100 text-indigo-600' },
                { q: 'Can I create multiple chat spaces?', a: 'Yes! You can create dedicated chat spaces for different subjects, courses, or projects, each with its own uploaded documents and memory context.', icon: '💬', iconBg: 'bg-purple-100 text-purple-600' },
                { q: 'Does EduAI remember my previous chats?', a: 'Yes, EduAI preserves full chat history within each dedicated chat space so you can return anytime and pick up right where you left off.', icon: '🕒', iconBg: 'bg-sky-100 text-sky-600' },
                { q: 'Is EduAI free to use?', a: 'EduAI is completely free to get started with generous document processing and query quotas. Premium tiers are available for heavy research workloads.', icon: '🌟', iconBg: 'bg-pink-100 text-pink-600' }
              ].map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? 'bg-[#f4f7ff] border border-indigo-100 shadow-xs'
                        : 'bg-white border border-slate-200/70 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-9 h-9 rounded-xl ${faq.iconBg} flex items-center justify-center text-base shrink-0 font-bold shadow-2xs`}>
                          {faq.icon}
                        </div>
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {faq.q}
                        </span>
                      </div>

                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-transform ${
                        isOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isOpen ? '−' : '+'}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-indigo-100/60 mt-1 pt-3 pl-16">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="pt-2">
                <button
                  onClick={() => {
                    setOpenFaq(0)
                    const el = document.getElementById('faq')
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 transition-all cursor-pointer hover:bg-indigo-100"
                >
                  <span>View All Frequently Asked Questions</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Right Sidebar Cards */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Still Need Help? */}
              <div className="bg-[#f4f7ff] border border-indigo-100/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shrink-0 font-bold shadow-2xs">
                    🎧
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Still Need Help?</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our team is here to assist you with any questions or issues.
                    </p>
                  </div>
                </div>

                <a
                  href="mailto:support@eduai.com"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <span>Contact Support</span>
                  <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              {/* Card 2: Quick Tips */}
              <div className="bg-[#fffbf0] border border-amber-100/90 rounded-3xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg font-bold shrink-0 shadow-2xs">
                    💡
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">Quick Tips</h3>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 font-medium">
                  {['Use clear and specific questions', 'Upload well-structured documents', 'Check source references'].map((tip, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ABOUT / OUR MISSION SECTION */}
      <section id="about" className="py-24 relative z-10 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Section Header with Team Illustration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
                About Us
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                Our Mission is to{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  Make Learning More Accessible
                </span>{' '}
                for Everyone
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                At EduAI, we believe everyone deserves a personal learning companion — one that is available anytime, anywhere, and adapts to their unique learning needs.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 font-serif italic text-purple-600 text-xs font-bold bg-purple-100/70 px-3.5 py-1.5 rounded-full border border-purple-200/70 shadow-2xs">
                  Same Curiosity · A Brighter Tomorrow ↗
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white/90 border border-indigo-100/70 p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-hidden">
                <img
                  src="/images/about-mission-team.png"
                  alt="EduAI Mission Team Learning Together"
                  className="w-full h-auto object-contain rounded-2xl group-hover:scale-102 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* 4 Core Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl p-6 border bg-[#faf7ff] border-purple-100/90 shadow-xs hover:shadow-lg transition-all space-y-3 group">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-600 font-bold text-lg flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Our Mission</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">To make high-quality learning accessible, personal, and effective for everyone.</p>
            </div>

            <div className="rounded-3xl p-6 border bg-[#f0f7ff] border-sky-100/90 shadow-xs hover:shadow-lg transition-all space-y-3 group">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 font-bold text-lg flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">👁️</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Our Vision</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">A world where anyone can learn, grow, and achieve their goals with the help of AI.</p>
            </div>

            <div className="rounded-3xl p-6 border bg-[#fff5f8] border-pink-100/90 shadow-xs hover:shadow-lg transition-all space-y-3 group">
              <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-600 font-bold text-lg flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">💖</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Our Values</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">Learner-first, Integrity, Innovation, Inclusivity, Continuous Improvement.</p>
            </div>

            <div className="rounded-3xl p-6 border bg-[#f4f7ff] border-indigo-100/90 shadow-xs hover:shadow-lg transition-all space-y-3 group">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 font-bold text-lg flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">👥</div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Our Approach</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">We combine the power of AI with real user needs to create simple, practical tools.</p>
            </div>
          </div>

          {/* "OUR STORY" SUB-SECTION ("BUILT BY LEARNERS, FOR LEARNERS") */}
          <div id="our-story" className="pt-16 border-t border-slate-200/60 scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Graphic Column */}
              <div className="lg:col-span-5 relative flex flex-col items-center justify-center">
                <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-white/90 border border-indigo-100/80 p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-hidden">
                  <img 
                    src="/images/our-story.png" 
                    alt="Built by Learners, for Learners - EduAI Story" 
                    className="w-full h-auto object-contain rounded-2xl group-hover:scale-102 transition-transform duration-500"
                  />

                  {/* Subtle Status Badge */}
                  <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-100 shadow-md flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-slate-800">Smarter Learning Experience</span>
                  </div>
                </div>
              </div>

              {/* Right Story Text Column */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
                  Our Story
                </div>

                <h3 className="text-3xl sm:text-4xl font-headline-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  Built by Learners,{' '}
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                    for Learners
                  </span>
                </h3>

                <div className="space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  <p>
                    EduAI started with a simple idea — to make learning less overwhelming and more enjoyable. As students ourselves, we experienced the challenges of managing notes, searching for answers, and staying organized.
                  </p>
                  <p>
                    So, we built EduAI — an AI-powered learning assistant that turns your documents into conversations, helps you understand complex concepts, and supports you throughout your learning journey.
                  </p>
                  <p>
                    Today, EduAI is used by thousands of learners who are exploring, questioning, and growing every day.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* "OUR COMMITMENT" SUB-SECTION */}
          <div className="pt-16 border-t border-slate-200/60 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold tracking-wide">
                Our Commitment
              </span>
              <h3 className="text-3xl sm:text-4xl font-headline-lg font-extrabold text-slate-900 tracking-tight">
                A Better Learning Future,{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  Together
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Student Privacy',
                  text: 'Your data stays yours. We are committed to keeping your information secure and private.',
                  icon: '🛡️',
                  bg: 'bg-[#f4f7ff] border-blue-100/90',
                  iconBg: 'bg-blue-100 text-blue-600'
                },
                {
                  title: 'Inclusive Access',
                  text: 'We strive to make EduAI accessible to learners from all backgrounds, everywhere in the world.',
                  icon: '🍃',
                  bg: 'bg-[#f4fbf7] border-emerald-100/90',
                  iconBg: 'bg-emerald-100 text-emerald-600'
                },
                {
                  title: 'Continuous Improvement',
                  text: 'We keep evolving based on your feedback to make learning better, simpler, and smarter.',
                  icon: '📊',
                  bg: 'bg-[#f0f7ff] border-sky-100/90',
                  iconBg: 'bg-sky-100 text-sky-600'
                },
                {
                  title: 'Community Driven',
                  text: 'Our journey is powered by a growing community of learners, educators, and creators like you.',
                  icon: '👥',
                  bg: 'bg-[#faf7ff] border-purple-100/90',
                  iconBg: 'bg-purple-100 text-purple-600'
                }
              ].map((com, idx) => (
                <div
                  key={idx}
                  className={`rounded-3xl p-6 border ${com.bg} shadow-xs hover:shadow-lg transition-all duration-300 space-y-3 group`}
                >
                  <div className={`w-11 h-11 rounded-2xl ${com.iconBg} font-bold text-lg flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform`}>
                    {com.icon}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {com.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {com.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MEET THE TEAM SECTION */}
          <div id="team" className="pt-16 border-t border-slate-200/60 space-y-10 scroll-mt-24">
            
            {/* Header: Title + Subtitle with Divider */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
              <div className="shrink-0">
                <h3 className="text-3xl sm:text-4xl font-headline-lg font-extrabold text-slate-900 tracking-tight">
                  Meet the Team
                </h3>
              </div>
              <div className="md:border-l-2 md:border-slate-200/80 md:pl-6 max-w-xl">
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  We are a group of passionate builders, designers, and education enthusiasts working together to make learning accessible to everyone.
                </p>
              </div>
            </div>

            {/* Team Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Member 1: Rakshit Katiyar */}
              <div 
                onClick={() => openTeamModal('rakshit')}
                className="bg-white/90 backdrop-blur-md rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-8px_rgba(79,70,229,0.15)] hover:border-indigo-300 hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                {/* Subtle Ambient Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-indigo-100/50 to-purple-100/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl ring-4 ring-white shadow-md overflow-hidden shrink-0 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 bg-slate-100 border border-slate-200/60">
                    <img
                      src="/images/team-rakshit.png"
                      alt="Rakshit Katiyar"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-xl sm:text-2xl font-headline-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight truncate">
                      Rakshit Katiyar
                    </h4>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        Founder & CEO
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal pt-1 line-clamp-2">
                      Passionate about AI, data, and building solutions that make a real impact in people&apos;s lives.
                    </p>
                  </div>
                </div>

                {/* Card Footer: Focus tags + Direct Actions */}
                <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-100 relative z-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {teamData.rakshit.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={teamData.rakshit.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-[#0A66C2] text-slate-400 hover:text-white border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95"
                      aria-label="Rakshit Katiyar LinkedIn"
                      title="Connect on LinkedIn"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.6a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
                      </svg>
                    </a>
                    <a
                      href={`mailto:${teamData.rakshit.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95"
                      aria-label="Email Rakshit Katiyar"
                      title="Send email to Rakshit"
                    >
                      <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Member 2: Aashika kumari */}
              <div 
                onClick={() => openTeamModal('aashika')}
                className="bg-white/90 backdrop-blur-md rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-8px_rgba(79,70,229,0.15)] hover:border-indigo-300 hover:-translate-y-1.5 active:scale-[0.99] transition-all duration-300 ease-out flex flex-col justify-between group cursor-pointer relative overflow-hidden"
              >
                {/* Subtle Ambient Hover Glow */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br from-indigo-100/50 to-purple-100/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                <div className="flex items-start gap-5 relative z-10">
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl ring-4 ring-white shadow-md overflow-hidden shrink-0 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 bg-slate-100 border border-slate-200/60">
                    <img
                      src="/images/team-aashika.png"
                      alt="Aashika kumari"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="text-xl sm:text-2xl font-headline-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight truncate">
                      Aashika kumari
                    </h4>
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        Co-Founder & Product
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-normal pt-1 line-clamp-2">
                      Focused on creating user-centric experiences that make learning simple and accessible.
                    </p>
                  </div>
                </div>

                {/* Card Footer: Focus tags + Direct Actions */}
                <div className="flex items-center justify-between gap-3 pt-5 mt-4 border-t border-slate-100 relative z-10">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {teamData.aashika.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={teamData.aashika.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-[#0A66C2] text-slate-400 hover:text-white border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95"
                      aria-label="Aashika kumari LinkedIn"
                      title="Connect on LinkedIn"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.6a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
                      </svg>
                    </a>
                    <a
                      href={`mailto:${teamData.aashika.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-indigo-600 text-slate-400 hover:text-white border border-slate-200/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-110 active:scale-95"
                      aria-label="Email Aashika kumari"
                      title="Send email to Aashika"
                    >
                      <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Journey Callout */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-8 sm:p-14 text-white text-center space-y-5 shadow-2xl shadow-indigo-500/25">
            <h2 className="text-3xl sm:text-5xl font-headline-lg font-extrabold tracking-tight">
              Ready to Upgrade Your Study Routine?
            </h2>
            <p className="text-indigo-100 max-w-xl mx-auto text-base sm:text-lg">
              Join thousands of students and learners using EduAI to turn dense study materials into smart conversations.
            </p>
            <div className="pt-2 flex justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-full text-base font-bold text-indigo-600 bg-white hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Start Learning Now — It&apos;s Free
              </Link>
              <button
                onClick={() => {
                  const el = document.getElementById('our-story')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                className="px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-indigo-500/30 hover:bg-indigo-500/50 border border-white/30 transition-all cursor-pointer hover:bg-indigo-500/60"
              >
                Read Our Story →
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER (ELEGANT GRID STRUCTURE - SLIGHTLY DARKER THEME) */}
      <footer className="bg-[#e9f0fc] border-t border-slate-200/90 pt-16 pb-12 text-slate-600 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Grid: 4 Balanced Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
            
            {/* Col 1 & 2: Brand, Mission & Live Status (Spans 2 columns) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <svg className="w-7 h-7 shrink-0" viewBox="0 0 36 28" fill="none">
                  <path d="M17 5.5C12.5 3.5 5.5 3.5 1 5.5V23.5C5.5 21.5 12.5 21.5 17 23.5V5.5Z" fill="#4F46E5" />
                  <path d="M19 5.5C23.5 3.5 30.5 3.5 35 5.5V23.5C30.5 21.5 23.5 21.5 19 23.5V5.5Z" fill="#6366F1" opacity="0.9" />
                </svg>
                <span className="font-headline-lg font-black text-slate-900 text-xl tracking-tight">EduAI</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                Your Personal AI Learning Companion. Upload documents, ask deep questions, and master any subject with grounded RAG intelligence.
              </p>

              {/* Status Indicator & GitHub Star Pill */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>All Systems Operational</span>
                </div>

                <a
                  href="https://github.com/Rakshit12902/EduAi"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors border border-slate-200/90 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                  </svg>
                  <span>Star on GitHub</span>
                </a>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Navigation
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <button onClick={() => handleNavClick('Home')} className="hover:text-indigo-600 transition-colors cursor-pointer">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('Features')} className="hover:text-indigo-600 transition-colors cursor-pointer">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('How It Works')} className="hover:text-indigo-600 transition-colors cursor-pointer">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('Use Cases')} className="hover:text-indigo-600 transition-colors cursor-pointer">
                    Use Cases
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('FAQ')} className="hover:text-indigo-600 transition-colors cursor-pointer">
                    FAQ
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('About')} className="hover:text-indigo-600 transition-colors cursor-pointer">
                    About Us
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Capabilities */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Capabilities
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <button onClick={() => handleNavClick('Features')} className="hover:text-indigo-600 transition-colors cursor-pointer text-left">
                    Document RAG Engine
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('Features')} className="hover:text-indigo-600 transition-colors cursor-pointer text-left">
                    Smart Flashcards
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('Features')} className="hover:text-indigo-600 transition-colors cursor-pointer text-left">
                    AI Quiz Generator
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('Features')} className="hover:text-indigo-600 transition-colors cursor-pointer text-left">
                    Document Summarizer
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('Features')} className="hover:text-indigo-600 transition-colors cursor-pointer text-left">
                    Qdrant Vector Search
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 5: Platform & Community */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Platform
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li>
                  <Link href="/login" className="hover:text-indigo-600 transition-colors font-medium">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-indigo-600 transition-colors font-medium">
                    Create Account
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => setVideoModalOpen(true)}
                    className="hover:text-indigo-600 transition-colors cursor-pointer text-left"
                  >
                    Watch Platform Demo
                  </button>
                </li>
                <li>
                  <button onClick={() => handleNavClick('About')} className="hover:text-indigo-600 transition-colors cursor-pointer text-left">
                    Meet the Team
                  </button>
                </li>
                <li>
                  <a
                    href="https://github.com/Rakshit12902/EduAi"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-indigo-600 transition-colors"
                  >
                    GitHub Source Code
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Sub-Footer Bar */}
          <div className="pt-8 mt-12 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} EduAI. Built for next-gen learning. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button onClick={() => handleNavClick('FAQ')} className="hover:text-slate-900 transition-colors cursor-pointer">
                Privacy & Data Safety
              </button>
              <button onClick={() => handleNavClick('FAQ')} className="hover:text-slate-900 transition-colors cursor-pointer">
                Terms of Service
              </button>
              <button onClick={() => handleNavClick('FAQ')} className="hover:text-slate-900 transition-colors cursor-pointer">
                Help & Support
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* VIDEO DEMO MODAL */}
      {videoModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setVideoModalOpen(false)}
        >
          <div 
            className="bg-slate-900 rounded-2xl sm:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5 font-bold text-white text-sm">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  </svg>
                </div>
                <span>EduAI Product Demo</span>
              </div>
              <button
                onClick={() => setVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video
                src="/demo.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED TEAM MEMBER SPOTLIGHT MODAL */}
      {activeModalMember && (
        <div 
          onClick={closeTeamModal}
          className={`fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 cursor-zoom-out select-none overflow-y-auto ${
            isModalClosing ? 'modal-backdrop-out' : 'modal-backdrop-in'
          }`}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-8 max-w-xl w-full border border-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] relative space-y-5 cursor-default my-auto max-h-[92vh] overflow-y-auto ${
              isModalClosing ? 'modal-zoom-out' : 'modal-zoom-in'
            }`}
          >
            {/* Soft Ambient Inner Glow */}
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Header: Badge & Close Button */}
            <div className="flex items-center justify-between relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-extrabold tracking-wide shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                Core Leadership Spotlight
              </div>
              <button
                onClick={closeTeamModal}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-sm font-bold shadow-2xs"
                aria-label="Close modal"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Large Profile Header */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left relative z-10">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-indigo-50 shadow-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-200/60">
                <img
                  src={teamData[activeModalMember].image}
                  alt={teamData[activeModalMember].name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-2xl sm:text-3xl font-headline-lg font-black text-slate-900 tracking-tight">
                  {teamData[activeModalMember].name}
                </h3>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                    {teamData[activeModalMember].role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed pt-0.5">
                  {teamData[activeModalMember].bio}
                </p>
              </div>
            </div>

            {/* Focus Areas / Expertise Tags */}
            <div className="flex flex-wrap items-center gap-2 relative z-10 pt-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Expertise:</span>
              {teamData[activeModalMember].tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/80 shadow-2xs">
                  {tag}
                </span>
              ))}
            </div>

            {/* Extended Leadership Mission / Story */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal relative z-10 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                <span>Mission & Vision</span>
              </div>
              <p>{teamData[activeModalMember].fullBio}</p>
            </div>

            {/* Action Links */}
            <div className="flex flex-wrap items-center gap-3 pt-1 relative z-10">
              <a
                href={teamData[activeModalMember].linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[150px] px-5 py-3 rounded-2xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.6a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z" />
                </svg>
                <span>LinkedIn Profile</span>
              </a>

              <a
                href={`mailto:${teamData[activeModalMember].email}`}
                className="flex-1 min-w-[150px] px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span>Send Email</span>
              </a>
            </div>

            {/* Dismiss helper */}
            <div className="text-center pt-1 relative z-10">
              <button
                onClick={closeTeamModal}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l-4 4m0 0l4 4m-4-4h14" />
                </svg>
                <span>Click anywhere outside or press Esc to zoom out</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
