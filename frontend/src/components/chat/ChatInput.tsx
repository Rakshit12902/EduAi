'use client'

import { useState, useRef } from 'react'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

interface ChatInputProps {
  chatId: string
  onUploadSuccess?: () => void
  onSendMessage?: (query: string, documentIds: string[]) => void
  disabled?: boolean
}

export default function ChatInput({ chatId, onUploadSuccess, onSendMessage, disabled }: ChatInputProps) {
  const [query, setQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, id: string}[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const formData = new FormData()
      formData.append('file', file)

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chats/${chatId}/documents/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session.access_token}`
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
              setUploadProgress(percentCompleted)
            }
          }
        }
      )

      setUploadedFiles(prev => [...prev, { name: file.name, id: res.data.document_id }])
      if (onUploadSuccess) onUploadSuccess()
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Upload failed')
      setIsUploading(false)
    }
    
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSend = () => {
    if (!query.trim()) return  // Never send empty messages
    if (onSendMessage) {
      onSendMessage(query, uploadedFiles.map(f => f.id))
    }
    setQuery('')
    setUploadedFiles([]) // Clear attachments after sending
  }

  const removeAttachment = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-2">
      {error && (
         <div className="p-2 text-xs text-on-error-container bg-error-container rounded-lg">
           {error}
         </div>
      )}
      
      {isUploading && (
        <div className="flex items-center space-x-3 px-4 py-2 bg-surface-container-high rounded-full w-fit">
          <span className="material-symbols-outlined text-primary animate-pulse text-sm">cloud_upload</span>
          <span className="text-xs font-medium text-on-surface">Uploading {fileInputRef.current?.files?.[0]?.name}... {uploadProgress}%</span>
        </div>
      )}

      {/* Document Previews */}
      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-2">
          {uploadedFiles.map((f, idx) => (
            <div 
              key={idx} 
              className="group relative flex items-center space-x-2 bg-surface-container-low/80 backdrop-blur-md text-on-surface px-3 py-1.5 rounded-xl border border-outline-variant/50 shadow-sm hover:border-primary/40 hover:bg-surface-container transition-all animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[16px]">description</span>
              </div>
              <span className="text-xs font-medium max-w-[160px] truncate">{f.name}</span>
              <button 
                onClick={() => removeAttachment(idx)}
                className="w-5 h-5 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors"
                title="Remove attachment"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-center bg-surface-container rounded-3xl p-2 shadow-sm border border-outline-variant focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          className="hidden" 
          accept=".pdf,.txt,.md,.docx,.png,.jpg,.jpeg,.webp"
        />
        
        {/* Attachment Button */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
          title="Attach Document"
        >
          <span className="material-symbols-outlined text-xl">attach_file</span>
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about your documents..."
          className="flex-1 bg-transparent border-none outline-none px-4 text-on-surface placeholder:text-on-surface-variant/60"
          disabled={disabled || isUploading}
        />

        {/* Send Button */}
        <button 
          onClick={handleSend}
          disabled={disabled || (!query.trim() && uploadedFiles.length === 0) || isUploading}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:bg-surface-container-high disabled:text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    </div>
  )
}
