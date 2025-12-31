'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Upload, X, FileText, Image, AlertCircle, CheckCircle, Loader2, Sparkles } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  preview?: string
  status: 'pending' | 'uploading' | 'analyzing' | 'complete' | 'error'
  error?: string
}

const loadingMessages = [
  "Lecture du document en cours...",
  "Extraction des données biologiques...",
  "Identification des biomarqueurs...",
  "Analyse des valeurs de référence...",
  "Comparaison avec les normes établies...",
  "Évaluation du bilan lipidique...",
  "Analyse de la fonction hépatique...",
  "Vérification des paramètres rénaux...",
  "Étude de la formule sanguine...",
  "Calcul des indices globulaires...",
  "Analyse du métabolisme glucidique...",
  "Évaluation du statut en fer...",
  "Vérification des marqueurs thyroïdiens...",
  "Analyse des électrolytes...",
  "Génération des insights personnalisés...",
  "Préparation des recommandations...",
  "Corrélation avec votre profil santé...",
  "Finalisation de l'analyse...",
  "Création du rapport détaillé...",
  "Presque terminé...",
]

export default function FileUpload({ onComplete }: { onComplete: () => void }) {
  const { profile, addAnalysis, setIsAnalyzing, setAnalysisProgress } = useAppStore()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Rotate loading messages
  useEffect(() => {
    if (!isProcessing) {
      setLoadingMessageIndex(0)
      return
    }
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)
    
    return () => clearInterval(interval)
  }, [isProcessing])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou PDF.'
    }
    if (file.size > 20 * 1024 * 1024) {
      return 'Fichier trop volumineux (max 20 Mo).'
    }
    return null
  }

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesToAdd: UploadedFile[] = []
    
    Array.from(newFiles).forEach((file) => {
      const error = validateFile(file)
      const id = Math.random().toString(36).substr(2, 9)
      
      const uploadedFile: UploadedFile = {
        id,
        file,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      }
      
      if (file.type.startsWith('image/') && !error) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id ? { ...f, preview: e.target?.result as string } : f
            )
          )
        }
        reader.readAsDataURL(file)
      }
      
      filesToAdd.push(uploadedFile)
    })
    
    setFiles((prev) => [...prev, ...filesToAdd])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
  }, [addFiles])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const processFiles = async () => {
    const validFiles = files.filter((f) => f.status === 'pending')
    if (validFiles.length === 0) return
    
    setIsProcessing(true)
    setIsAnalyzing(true)
    
    try {
      setCurrentStep('Préparation des fichiers...')
      setAnalysisProgress(10)
      
      const filesData = await Promise.all(
        validFiles.map(async (uploadedFile) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, status: 'uploading' } : f
            )
          )
          
          return new Promise<{ name: string; type: string; data: string }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1]
              resolve({
                name: uploadedFile.file.name,
                type: uploadedFile.file.type,
                data: base64,
              })
            }
            reader.readAsDataURL(uploadedFile.file)
          })
        })
      )
      
      setCurrentStep('Analyse en cours...')
      setAnalysisProgress(30)
      
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'analyzing' } : f
        )
      )
      
      // Créer un AbortController pour gérer les timeouts
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 25000) // 25 secondes (juste sous la limite Netlify)
      
      let response: Response
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: filesData,
            profile,
            apiKey: profile?.openaiKey,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          throw new Error('L\'analyse prend trop de temps. Essayez avec moins de fichiers ou des images plus petites.')
        }
        throw fetchError
      }
      
      setAnalysisProgress(80)
      
      // Vérifier le Content-Type pour s'assurer qu'on reçoit du JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Réponse non-JSON reçue:', text.substring(0, 200))
        
        // Détecter spécifiquement les timeouts Netlify
        if (text.includes('Inactivity Timeout') || text.includes('timeout')) {
          throw new Error('L\'analyse a pris trop de temps et a été annulée. Essayez avec moins de fichiers ou des images plus petites.')
        }
        
        throw new Error('Le serveur a retourné une réponse invalide. Vérifiez votre connexion et réessayez.')
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erreur lors de l\'analyse' }))
        throw new Error(error.message || 'Erreur lors de l\'analyse')
      }
      
      const result = await response.json()
      
      setCurrentStep('Finalisation...')
      setAnalysisProgress(100)
      
      addAnalysis({
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        fileName: validFiles.map((f) => f.file.name).join(', '),
        ...result,
      })
      
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'analyzing' ? { ...f, status: 'complete' } : f
        )
      )
      
      setTimeout(() => {
        onComplete()
      }, 1000)
      
    } catch (error) {
      console.error('Analysis error:', error)
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'analyzing' || f.status === 'uploading'
            ? { ...f, status: 'error', error: (error as Error).message }
            : f
        )
      )
    } finally {
      setIsProcessing(false)
      setIsAnalyzing(false)
      setAnalysisProgress(0)
      setCurrentStep('')
    }
  }

  const validFilesCount = files.filter((f) => f.status === 'pending').length

  // Full-screen loading overlay
  if (isProcessing) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          {/* Animated loader */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-accent-secondary"></div>
            {/* Spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent-primary animate-spin"></div>
            {/* Inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent-primary animate-pulse" />
            </div>
          </div>
          
          {/* Main text */}
          <h2 className="text-xl font-display font-semibold text-text-primary mb-3">
            Analyse en cours
          </h2>
          
          {/* Rotating message */}
          <div className="h-12 flex items-center justify-center">
            <p 
              key={loadingMessageIndex}
              className="text-text-secondary animate-fade-in"
            >
              {loadingMessages[loadingMessageIndex]}
            </p>
          </div>
          
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-accent-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          
          {/* File info */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-text-muted">
              {files.filter(f => f.status !== 'error').length} fichier(s) en cours de traitement
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-semibold text-text-primary mb-2">
          Nouvelle analyse
        </h1>
        <p className="text-text-secondary">
          Importez vos résultats de prise de sang pour obtenir une analyse détaillée.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          drop-zone rounded-xl p-10 text-center cursor-pointer
          ${isDragging ? 'active' : ''}
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        
        <div className="w-14 h-14 rounded-xl bg-accent-secondary flex items-center justify-center mx-auto mb-4">
          <Upload className={`w-6 h-6 ${isDragging ? 'text-accent-primary' : 'text-text-muted'}`} />
        </div>
        
        <p className="font-medium text-text-primary mb-1">
          {isDragging ? 'Déposez vos fichiers' : 'Glissez-déposez vos fichiers'}
        </p>
        <p className="text-sm text-text-muted mb-4">
          ou cliquez pour parcourir
        </p>
        <div className="flex items-center justify-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            JPG, PNG
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            PDF
          </span>
          <span>Max 20 Mo</span>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className={`
                flex items-center gap-4 p-4 rounded-xl border
                ${uploadedFile.status === 'error' 
                  ? 'bg-red-50 border-red-200' 
                  : uploadedFile.status === 'complete'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-surface border-border'}
              `}
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-alt flex items-center justify-center flex-shrink-0">
                {uploadedFile.preview ? (
                  <img 
                    src={uploadedFile.preview} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : uploadedFile.file.type === 'application/pdf' ? (
                  <FileText className="w-5 h-5 text-text-muted" />
                ) : (
                  <Image className="w-5 h-5 text-text-muted" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-text-muted">
                  {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} Mo
                  {uploadedFile.error && (
                    <span className="text-status-attention ml-2">· {uploadedFile.error}</span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {uploadedFile.status === 'pending' && (
                  <span className="text-xs text-text-muted px-2 py-1 bg-surface-alt rounded">Prêt</span>
                )}
                {(uploadedFile.status === 'uploading' || uploadedFile.status === 'analyzing') && (
                  <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
                )}
                {uploadedFile.status === 'complete' && (
                  <CheckCircle className="w-4 h-4 text-status-optimal" />
                )}
                {uploadedFile.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-status-attention" />
                )}
                
                {!isProcessing && uploadedFile.status !== 'complete' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(uploadedFile.id)
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
                  >
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onComplete}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl font-medium btn-secondary"
        >
          Annuler
        </button>
        <button
          onClick={processFiles}
          disabled={validFilesCount === 0 || isProcessing}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium
            ${validFilesCount === 0 || isProcessing
              ? 'bg-border text-text-muted cursor-not-allowed'
              : 'btn-primary'}
          `}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              Analyser
              {validFilesCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {validFilesCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
