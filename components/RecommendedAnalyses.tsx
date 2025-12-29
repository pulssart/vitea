'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { CheckCircle2, Circle, Loader2, Sparkles, Calendar, AlertCircle, RefreshCw } from 'lucide-react'

export default function RecommendedAnalyses() {
  const { profile, analyses, recommendedAnalyses, setRecommendedAnalyses, toggleAnalysisCompleted, healthPlan } = useAppStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const latestAnalysis = analyses[0]

  // Générer les analyses recommandées si elles n'existent pas
  const generateAnalyses = async () => {
    if (!profile?.openaiKey) {
      setError('Clé API OpenAI requise dans les paramètres')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/recommended-analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          analyses,
          apiKey: profile.openaiKey,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la génération')
      }

      const data = await response.json()
      setRecommendedAnalyses(data.analyses || [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération des analyses recommandées')
    } finally {
      setIsGenerating(false)
    }
  }

  // Générer au montage si pas d'analyses recommandées
  useEffect(() => {
    if (recommendedAnalyses.length === 0 && profile?.openaiKey && !isGenerating) {
      generateAnalyses()
    }
  }, [])

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'Prioritaire'
      case 'medium':
        return 'Recommandé'
      case 'low':
        return 'Optionnel'
      default:
        return priority
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sang':
        return '🩸'
      case 'urine':
        return '💧'
      case 'imagerie':
        return '📷'
      default:
        return '🔬'
    }
  }

  const completedCount = recommendedAnalyses.filter(a => a.completed).length
  const totalCount = recommendedAnalyses.length

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
            <Calendar className="w-6 h-6 text-accent-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Mes analyses</h2>
            <p className="text-sm text-text-muted">
              Analyses recommandées selon votre profil
            </p>
          </div>
        </div>
        {recommendedAnalyses.length > 0 && (
          <button
            onClick={generateAnalyses}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Régénérer
          </button>
        )}
      </div>

      {isGenerating && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary mx-auto mb-3" />
            <p className="text-sm text-text-muted">Génération des analyses recommandées...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium mb-1">Erreur</p>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={generateAnalyses}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!isGenerating && recommendedAnalyses.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-accent-secondary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-accent-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Aucune analyse recommandée
          </h3>
          <p className="text-text-secondary mb-6 max-w-sm mx-auto">
            Cliquez sur "Générer" pour obtenir des recommandations personnalisées basées sur votre profil.
          </p>
          <button
            onClick={generateAnalyses}
            disabled={!profile?.openaiKey}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Générer les recommandations
          </button>
        </div>
      )}

      {!isGenerating && recommendedAnalyses.length > 0 && (
        <>
          {/* Progress */}
          <div className="mb-6 p-4 bg-surface-alt border border-border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">Progression</span>
              <span className="text-sm text-text-muted">
                {completedCount} / {totalCount} complétées
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-accent-primary transition-all duration-300"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Analyses List */}
          <div className="space-y-3">
            {recommendedAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className={`border rounded-xl p-4 transition-all ${
                  analysis.completed
                    ? 'bg-surface-alt border-border opacity-75'
                    : 'bg-surface border-border hover:border-accent-primary/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleAnalysisCompleted(analysis.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {analysis.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-accent-primary" />
                    ) : (
                      <Circle className="w-5 h-5 text-text-muted hover:text-accent-primary transition-colors" />
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3
                          className={`font-semibold text-text-primary mb-1 ${
                            analysis.completed ? 'line-through' : ''
                          }`}
                        >
                          <span className="mr-2">{getCategoryIcon(analysis.category)}</span>
                          {analysis.name}
                        </h3>
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {analysis.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityColor(
                          analysis.priority
                        )}`}
                      >
                        {getPriorityLabel(analysis.priority)}
                      </span>
                    </div>

                    {/* Frequency and Includes */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{analysis.frequency}</span>
                      </div>
                      {analysis.includes && analysis.includes.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">Inclut:</span>
                          <span className="text-text-secondary">
                            {analysis.includes.length > 3
                              ? `${analysis.includes.slice(0, 3).join(', ')} +${analysis.includes.length - 3} autres`
                              : analysis.includes.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

