'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Upload, Dna, FileText, AlertCircle, CheckCircle, Loader2, X, Info } from 'lucide-react'

const loadingMessages = [
  "Lecture de votre fichier ADN...",
  "Identification du format (23andMe, Ancestry...)...",
  "Extraction des SNPs de votre génome...",
  "Plus de 600 000 variants génétiques à analyser...",
  "Identification des gènes associés...",
  "Analyse des variants de santé...",
  "Évaluation des risques cardiovasculaires...",
  "Analyse du métabolisme des médicaments...",
  "Étude des intolérances alimentaires potentielles...",
  "Analyse des traits physiques...",
  "Évaluation des capacités sportives...",
  "Recherche des variants rares...",
  "Calcul des scores polygéniques...",
  "Comparaison avec les bases de données scientifiques...",
  "Génération des recommandations personnalisées...",
  "Préparation de votre rapport génétique...",
  "Finalisation de l'analyse...",
]

const supportedFormats = [
  { name: '23andMe', extension: '.txt', icon: '🧬' },
  { name: 'AncestryDNA', extension: '.txt', icon: '🌍' },
  { name: 'MyHeritage', extension: '.csv', icon: '🏠' },
  { name: 'FamilyTreeDNA', extension: '.csv', icon: '🌳' },
  { name: 'Nebula Genomics', extension: '.txt', icon: '🌌' },
]

export default function DNAUpload() {
  const { profile, addDNAAnalysis, isAnalyzing, setIsAnalyzing, dnaAnalyses } = useAppStore()
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  
  // Hide help sections if DNA analysis has been completed
  const hasCompletedAnalysis = dnaAnalyses.length > 0

  // Rotate loading messages
  useEffect(() => {
    if (!isAnalyzing) return
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const validateFile = (file: File): boolean => {
    const validTypes = ['.txt', '.csv']
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    
    if (!validTypes.includes(extension)) {
      setError('Format non supporté. Utilisez un fichier .txt ou .csv de votre service ADN.')
      return false
    }
    
    // Check file size (max 100MB for raw DNA files)
    if (file.size > 100 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 100 Mo)')
      return false
    }
    
    setError(null)
    return true
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const processFile = async () => {
    if (!selectedFile || !profile?.openaiKey) return

    setIsAnalyzing(true)
    setError(null)
    setCurrentMessageIndex(0)

    try {
      // Read file content
      const content = await selectedFile.text()
      
      // Send to API
      const response = await fetch('/api/analyze-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          fileName: selectedFile.name,
          profile,
          apiKey: profile.openaiKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de l\'analyse')
      }

      const result = await response.json()
      
      addDNAAnalysis({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        fileName: selectedFile.name,
        ...result,
      })

      setSelectedFile(null)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse ADN')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Full screen loading overlay
  if (isAnalyzing) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto">
              <Dna className="w-24 h-24 text-accent-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            Analyse ADN en cours
          </h2>
          
          <p className="text-text-secondary mb-6 h-12 flex items-center justify-center transition-opacity duration-500">
            {loadingMessages[currentMessageIndex]}
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Traitement de {selectedFile?.name}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* API Key Warning */}
      {!profile?.openaiKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Clé API OpenAI requise</p>
            <p className="text-amber-700 text-sm mt-1">
              Configurez votre clé API dans les paramètres pour analyser vos fichiers ADN.
            </p>
          </div>
        </div>
      )}

      {/* Info Box - Hidden if analysis completed */}
      {!hasCompletedAnalysis && (
        <div className="bg-accent-secondary/50 border border-accent-primary/20 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-text-primary font-medium">Comment obtenir votre fichier ADN ?</p>
            <p className="text-text-secondary text-sm mt-1">
              Téléchargez votre fichier "raw data" depuis votre compte 23andMe, AncestryDNA, MyHeritage ou autre service de test ADN.
              Ce fichier contient vos données génétiques brutes.
            </p>
          </div>
        </div>
      )}

      {/* Supported Formats - Hidden if analysis completed */}
      {!hasCompletedAnalysis && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {supportedFormats.map((format) => (
            <div
              key={format.name}
              className="bg-surface border border-border rounded-lg p-3 text-center"
            >
              <span className="text-2xl mb-1 block">{format.icon}</span>
              <p className="text-sm font-medium text-text-primary">{format.name}</p>
              <p className="text-xs text-text-muted">{format.extension}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone - Hidden if analysis completed */}
      {!hasCompletedAnalysis && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? 'border-accent-primary bg-accent-secondary/50'
              : 'border-border hover:border-accent-primary/50 hover:bg-surface-alt'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".txt,.csv"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-secondary flex items-center justify-center">
              <Dna className="w-8 h-8 text-accent-primary" />
            </div>
            
            <div>
              <p className="text-text-primary font-medium">
                Glissez votre fichier ADN ici
              </p>
              <p className="text-text-muted text-sm mt-1">
                ou cliquez pour sélectionner (.txt, .csv)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Selected File */}
      {selectedFile && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">{selectedFile.name}</p>
                <p className="text-sm text-text-muted">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          
          <button
            onClick={processFile}
            disabled={!profile?.openaiKey}
            className="mt-4 w-full bg-accent-primary text-white py-3 px-4 rounded-xl font-medium
              hover:bg-accent-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            <Dna className="w-5 h-5" />
            Analyser mon ADN
          </button>
        </div>
      )}
    </div>
  )
}
