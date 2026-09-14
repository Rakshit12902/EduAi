import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { supabase } from '@/lib/supabase'

export interface MessageSource {
  document_id: string
  filename: string
  page_number?: string | number
  excerpt?: string
  relevance_score?: number
}

interface ChatMessageProps {
  id?: string
  chatId?: string
  role: 'user' | 'assistant'
  content: string
  answer_type?: 'document' | 'general'
  sources?: MessageSource[]
  initialFeedback?: number | null
  onRegenerate?: () => void
  isRegenerating?: boolean
}

function cleanExcerptText(raw?: string): string {
  if (!raw) return 'Excerpt snippet available in search context.'
  let t = raw
  // Strip bracketed parser headers: [Page 1 Visual Content & Text: ...], [Uploaded Image Content: ...]
  t = t.replace(/^\[(?:Page\s*\d+[^\n\]]*|Image\s*\d+[^\n\]]*|Uploaded\s*Image\s*Content)[^:\n]*:?\s*/i, '')
  // Strip markdown headers like ### Verbatim Text Extraction
  t = t.replace(/#{1,6}\s*(?:Verbatim\s*Text\s*Extraction|Extracted\s*Text|Visual\s*Diagram\s*Description)[:\s]*/gi, '')
  // Strip page dividers
  t = t.replace(/^---\s*Page\s*\d+\s*---\s*/gi, '')
  // Strip decorative logo remarks like (Logo: includes a purple caret symbol...)
  t = t.replace(/\(Logo:[^\)]*\)/gi, '')
  // Strip standalone brackets
  t = t.replace(/^\[\s*/g, '').replace(/\s*\]$/g, '')
  // Clean empty or stray markdown bullet points
  t = t.replace(/^\s*[\*\-]\s+/gm, '• ')
  return t.trim() || 'Excerpt snippet available in search context.'
}

export default function ChatMessage({ 
  id,
  chatId,
  role, 
  content, 
  answer_type, 
  sources,
  initialFeedback,
  onRegenerate,
  isRegenerating
}: ChatMessageProps) {
  const isUser = role === 'user'
  const [activeExcerpt, setActiveExcerpt] = useState<MessageSource | null>(null)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const [copiedExcerpt, setCopiedExcerpt] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(
    initialFeedback === 1 ? 'up' : initialFeedback === -1 ? 'down' : null
  )

  useEffect(() => {
    if (initialFeedback === 1) setFeedback('up')
    else if (initialFeedback === -1) setFeedback('down')
    else if (initialFeedback === 0) setFeedback(null)
  }, [initialFeedback])

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanedContent)
      } else {
        const ta = document.createElement('textarea')
        ta.value = cleanedContent
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleFeedback = async (type: 'up' | 'down') => {
    const nextFeedback = feedback === type ? null : type
    setFeedback(nextFeedback)

    if (id && chatId) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const ratingVal = nextFeedback === 'up' ? 1 : nextFeedback === 'down' ? -1 : 0
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${chatId}/messages/${id}/feedback`,
            { rating: ratingVal },
            { headers: { Authorization: `Bearer ${session.access_token}` } }
          )
        }
      } catch (err) {
        console.warn('Failed to submit feedback:', err)
      }
    }
  }

  // Clean up any legacy warning text strings from display since badge is shown
  const cleanedContent = content
    .replace(/^⚠️\s*This answer is from general knowledge,?\s*not your uploaded documents\.?\s*/i, '')
    .trim()

  // Filter out low relevance sources (< 60% match) and deduplicate sources by filename & page number
  const validSources = sources ? sources.filter(s => (s.relevance_score ?? 0) >= 0.60) : []
  const uniqueSources = validSources.filter((s, idx, self) => 
    idx === self.findIndex(t => t.filename === s.filename && t.page_number === s.page_number)
  )

  // Badge logic:
  // An answer is ONLY Grounded in Documents if it actually has valid matching sources (>= 60% match) AND is not marked general.
  // When there are no valid matching sources, or answer_type is general, it is General Knowledge.
  const hasSources = uniqueSources.length > 0
  const isDocumentAnswer = !isUser && hasSources && answer_type !== 'general'
  const isGeneralAnswer = !isUser && (!hasSources || answer_type === 'general')

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[88%] sm:max-w-2xl lg:max-w-3xl flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        {isUser ? (
          <div className="w-9 h-9 shrink-0 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold shadow-xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        ) : (
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#60a5fa] text-white flex items-center justify-center font-bold shadow-xs">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" />
            </svg>
          </div>
        )}

        {/* Bubble & Content */}
        <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
          
          {/* User Message */}
          {isUser ? (
            <div className="flex flex-col items-end">
              <div className="bg-[#d1fae5] dark:bg-emerald-950/80 text-slate-900 dark:text-emerald-100 font-medium px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-2xs text-sm leading-relaxed self-end border border-transparent dark:border-emerald-800/60">
                {cleanedContent}
              </div>
              <div className="flex items-center gap-1.5 mt-1 mr-1 text-slate-400 dark:text-slate-500 text-[11px] font-medium select-none">
                <span>Just now</span>
                <span className="text-[#0ea5e9] font-bold tracking-tighter">✓✓</span>
              </div>
            </div>
          ) : (
            /* Assistant Message Card */
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xs text-slate-800 dark:text-slate-200 text-sm leading-relaxed self-start w-full">
              
              {/* Answer Type Badge */}
              {content && (
                <div className="flex items-center gap-2 mb-3">
                  {isDocumentAnswer ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#dcfce7] dark:bg-emerald-950/70 text-[#059669] dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                      Grounded in your documents
                    </span>
                  ) : isGeneralAnswer ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#fef3c7] dark:bg-amber-950/70 text-[#d97706] dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
                      </svg>
                      General Knowledge
                    </span>
                  ) : null}
                </div>
              )}

              {/* Message Text */}
              {content ? (
                <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 first:mt-0">{children}</h3>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc list-outside pl-5 space-y-1 mb-2.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-outside pl-5 space-y-1 mb-2.5">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      code: ({ children, className }) => {
                        const isBlock = className?.includes('language-')
                        if (isBlock) {
                          return <code className="block p-3 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto my-2">{children}</code>
                        }
                        return <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono">{children}</code>
                      },
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-emerald-500 pl-3 italic text-slate-600 dark:text-slate-400 my-2">{children}</blockquote>,
                      table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-700">{children}</table></div>,
                      th: ({ children }) => <th className="bg-slate-100 dark:bg-slate-800 px-3 py-2 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">{children}</th>,
                      td: ({ children }) => <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">{children}</td>,
                    }}
                  >
                    {cleanedContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 italic py-1">
                  <div className="w-4 h-4 border-2 border-slate-300 dark:border-slate-700 border-t-emerald-600 rounded-full animate-spin" />
                  <span>Generating response...</span>
                </div>
              )}

              {/* Interactive Source Document Card */}
              {uniqueSources.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uniqueSources.map((s, idx) => {
                    const scorePct = s.relevance_score ? Math.round(s.relevance_score * 100) : 67
                    return (
                      <div key={idx} className="p-3 bg-[#f8fafd] dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Red PDF Icon */}
                          <div className="w-8 h-8 rounded-lg bg-[#ef4444] text-white flex items-center justify-center font-black text-[10px] shrink-0 tracking-wider shadow-2xs">
                            PDF
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[240px] sm:max-w-xs md:max-w-sm">
                              {s.filename}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                {s.page_number ? `Page ${s.page_number} • Image` : 'Document match'}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#dcfce7] dark:bg-emerald-950/80 text-[#059669] dark:text-emerald-400 border border-transparent dark:border-emerald-800/50">
                                {scorePct}% match
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => setActiveExcerpt(activeExcerpt === s ? null : s)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-all shadow-2xs cursor-pointer ${
                            activeExcerpt === s 
                              ? 'border-[#059669] dark:border-emerald-500 text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 bg-white dark:bg-slate-800'
                          }`}
                        >
                          <span>{activeExcerpt === s ? 'Hide' : 'View'}</span>
                          <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}

                  {/* Excerpt Modal / Popover */}
                  {activeExcerpt && (
                    <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 border-l-4 border-l-[#059669] dark:border-l-emerald-500 rounded-xl text-xs relative shadow-xs transition-all animate-in fade-in-50 duration-200">
                      <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-[#059669] dark:text-emerald-400">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                            <span>Source Excerpt</span>
                          </span>

                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={activeExcerpt.filename || 'Document'}>
                            {activeExcerpt.filename || 'Referenced Document'}
                          </span>

                          {activeExcerpt.page_number && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300">
                              Page {activeExcerpt.page_number}
                            </span>
                          )}

                          {activeExcerpt.relevance_score != null && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100/80 dark:bg-emerald-950/70 text-[#059669] dark:text-emerald-400">
                              {Math.round(activeExcerpt.relevance_score * 100)}% match
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const cleaned = cleanExcerptText(activeExcerpt.excerpt)
                              navigator.clipboard.writeText(cleaned)
                              setCopiedExcerpt(true)
                              setTimeout(() => setCopiedExcerpt(false), 2000)
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                            title="Copy excerpt text"
                          >
                            {copiedExcerpt ? (
                              <span className="text-[#059669] dark:text-emerald-400 font-bold">✓ Copied</span>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375H9.75" />
                                </svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button 
                            type="button"
                            onClick={() => setActiveExcerpt(null)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                            title="Close"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-slate-700 dark:text-slate-200 leading-relaxed pr-1 select-text selection:bg-emerald-100 dark:selection:bg-emerald-900/50">
                        {cleanExcerptText(activeExcerpt.excerpt)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between mt-4 pt-2 text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1">
                  {/* 1. Copy Message */}
                  <button 
                    type="button"
                    onClick={handleCopyMessage}
                    className="p-1.5 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center cursor-pointer" 
                    title={copiedMessage ? 'Copied to clipboard' : 'Copy message'}
                  >
                    {copiedMessage ? (
                      <span className="flex items-center gap-1 text-[#059669] dark:text-emerald-400 text-xs font-semibold px-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        <span>Copied</span>
                      </span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                    )}
                  </button>
                  
                  {/* 2. Thumbs Up */}
                  <button 
                    type="button"
                    onClick={() => handleFeedback('up')}
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                      feedback === 'up' 
                        ? 'text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' 
                        : 'hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`} 
                    title="Helpful"
                  >
                    <svg className="w-4 h-4" fill={feedback === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25M6.633 10.5H3.75A2.25 2.25 0 001.5 12.75v6a2.25 2.25 0 002.25 2.25h2.883" />
                    </svg>
                  </button>
                  
                  {/* 3. Thumbs Down */}
                  <button 
                    type="button"
                    onClick={() => handleFeedback('down')}
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                      feedback === 'down' 
                        ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60' 
                        : 'hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`} 
                    title="Not helpful"
                  >
                    <svg className="w-4 h-4 -scale-y-100" fill={feedback === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.25M6.633 10.5H3.75A2.25 2.25 0 001.5 12.75v6a2.25 2.25 0 002.25 2.25h2.883" />
                    </svg>
                  </button>
                  
                  {/* 4. Regenerate */}
                  <button 
                    type="button"
                    onClick={() => onRegenerate && onRegenerate()}
                    disabled={isRegenerating}
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                      isRegenerating 
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' 
                        : 'hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`} 
                    title="Regenerate response"
                  >
                    <svg className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-emerald-500' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  </button>
                </div>

                <span className="text-[11px] font-medium select-none text-slate-400 dark:text-slate-500">
                  Just now
                </span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  )
}
