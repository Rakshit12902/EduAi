import React, { useState } from 'react'

export interface MessageSource {
  document_id: string
  filename: string
  page_number?: string | number
  excerpt?: string
  relevance_score?: number
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  answer_type?: 'document' | 'general'
  sources?: MessageSource[]
}

export default function ChatMessage({ role, content, answer_type, sources }: ChatMessageProps) {
  const isUser = role === 'user'
  const [activeExcerpt, setActiveExcerpt] = useState<MessageSource | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Clean up any legacy warning text strings from display since badge is shown
  const cleanedContent = content
    .replace(/^⚠️\s*This answer is from general knowledge,?\s*not your uploaded documents\.?\s*/i, '')
    .trim()

  // Filter out low relevance sources (< 60% match) and deduplicate sources by filename & page number
  const validSources = sources ? sources.filter(s => (s.relevance_score ?? 0) >= 0.60) : []
  const uniqueSources = validSources.filter((s, idx, self) => 
    idx === self.findIndex(t => t.filename === s.filename && t.page_number === s.page_number)
  )

  // Badge logic: ONLY show 'Grounded in your documents' if valid sources (>= 60% match) were used
  const hasSources = uniqueSources.length > 0
  const isDocumentAnswer = !isUser && (hasSources || answer_type === 'document')
  const isGeneralAnswer = !isUser && !hasSources && answer_type === 'general'

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-medium shadow-sm ${
          isUser ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {isUser ? 'person' : 'smart_toy'}
          </span>
        </div>

        {/* Bubble & Content */}
        <div className="flex flex-col gap-2 min-w-[240px]">
          
          {/* Answer Type Badge */}
          {!isUser && content && (
            <div className="flex items-center gap-2 mb-1">
              {isDocumentAnswer ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                  Grounded in your documents
                </span>
              ) : isGeneralAnswer ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <span className="material-symbols-outlined text-[14px]">public</span>
                  General Knowledge
                </span>
              ) : null}
            </div>
          )}

          {/* Message Text Bubble */}
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-full ${
            isUser 
              ? 'bg-primary text-on-primary rounded-tr-sm shadow-sm self-end' 
              : 'bg-surface-container text-on-surface rounded-tl-sm border border-outline-variant/40 shadow-sm self-start'
          }`}>
            {content ? (
              <div className="whitespace-pre-wrap">
                {cleanedContent}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-on-surface-variant italic py-1">
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Generating response...</span>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className={`flex items-center gap-1.5 mt-0.5 text-on-surface-variant/60 ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(cleanedContent)
                setCopiedCode(cleanedContent)
                setTimeout(() => setCopiedCode(null), 2000)
              }}
              className="p-1 hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center" 
              title="Copy message"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedCode === cleanedContent ? 'check' : 'content_copy'}
              </span>
            </button>
            
            {isUser ? (
              <button className="p-1 hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center" title="Edit query">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            ) : (
              <>
                <button className="p-1 hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center" title="Regenerate response">
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
                <button className="p-1 hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center" title="Good response">
                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                </button>
                <button className="p-1 hover:text-on-surface hover:bg-surface-container-high rounded-md transition-colors flex items-center justify-center" title="Bad response">
                  <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                </button>
              </>
            )}
            
            <span className={`text-[11px] font-medium ${isUser ? 'mr-2' : 'ml-2'}`}>
              just now
            </span>
          </div>

          {/* Interactive Source Cards */}
          {uniqueSources.length > 0 && !isUser && (
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-outline-variant/20 self-start w-full">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">attach_file</span>
                  Cited Sources ({uniqueSources.length}):
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {uniqueSources.map((s, idx) => {
                  const scorePct = s.relevance_score ? Math.round(s.relevance_score * 100) : null
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveExcerpt(activeExcerpt === s ? null : s)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high hover:bg-tertiary-container hover:text-on-tertiary-container text-on-surface-variant transition-all border border-outline-variant/30 text-left shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px] text-primary">description</span>
                      <span className="font-semibold truncate max-w-[140px]">{s.filename}</span>
                      {s.page_number && <span className="opacity-75">(Pg. {s.page_number})</span>}
                      {scorePct !== null && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-primary/10 text-primary rounded-md font-bold">
                          {scorePct}% match
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Excerpt Modal / Popover */}
              {activeExcerpt && (
                <div className="mt-2 p-3 bg-surface-container-highest border border-primary/20 rounded-xl text-xs relative animate-fadeIn shadow-sm">
                  <div className="flex items-center justify-between font-semibold text-primary mb-1 pb-1 border-b border-outline-variant/20">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">search</span>
                      Excerpt from {activeExcerpt.filename} {activeExcerpt.page_number ? `(Page ${activeExcerpt.page_number})` : ''}
                    </span>
                    <button 
                      onClick={() => setActiveExcerpt(null)}
                      className="text-on-surface-variant hover:text-on-surface p-0.5 rounded"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <p className="italic text-on-surface-variant leading-relaxed font-serif">
                    "{activeExcerpt.excerpt || 'Excerpt snippet available in search context.'}"
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
