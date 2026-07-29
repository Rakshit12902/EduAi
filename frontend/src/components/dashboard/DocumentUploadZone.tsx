'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import axios from 'axios'
import { supabase } from '@/lib/supabase'

interface DocumentUploadZoneProps {
  chatId: string
  onUploadSuccess?: () => void
}

export default function DocumentUploadZone({ chatId, onUploadSuccess }: DocumentUploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(
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

      if (onUploadSuccess) {
        onUploadSuccess()
      }
      // Reset after success
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1500)
      
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || 'Failed to upload document. Please try again.')
      setIsUploading(false)
    }
  }, [chatId, onUploadSuccess])

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false
  })

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out p-12 text-center
          ${isDragAccept ? 'border-primary bg-primary-container/20' : ''}
          ${isDragReject ? 'border-error bg-error-container/20' : ''}
          ${!isDragActive ? 'border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary/50' : ''}
          ${isUploading ? 'pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300
            ${isDragActive ? 'bg-primary text-on-primary scale-110' : 'bg-secondary-container text-on-secondary-container'}
          `}>
            <span className="material-symbols-outlined text-3xl">
              {isUploading ? 'cloud_upload' : 'upload_file'}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-display font-semibold text-on-surface">
              {isUploading ? 'Uploading...' : 'Drop your document here'}
            </h3>
            <p className="text-sm text-on-surface-variant font-body max-w-sm mx-auto">
              {!isUploading && "Supports PDF, DOCX, TXT, and MD files up to 50MB. We'll automatically process and vectorize it for you."}
            </p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs mx-auto mt-6">
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-primary mt-2">
                {uploadProgress}%
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
        </div>
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl opacity-50" />
      </div>
    </div>
  )
}
