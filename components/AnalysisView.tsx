'use client'

import { useMemo, useState } from 'react'
import { useAppStore, getStatusColor, getStatusLabel, Biomarker } from '@/lib/store'
import { ArrowLeft, Calendar, FileText, Search, X, AlertCircle, CheckCircle, Minus } from 'lucide-react'
import BiomarkerChart from './BiomarkerChart'

interface AnalysisViewProps {
  analysisId: string
  onBack: () => void
}

export default function AnalysisView({ analysisId, onBack }: AnalysisViewProps) {
  const { analyses } = useAppStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null)

  const analysis = analyses.find((a) => a.id === analysisId)

  const categories = useMemo(() => {
    if (!analysis) return []
    const cats = [...new Set(analysis.biomarkers.map((b) => b.category))]
    return cats.sort()
  }, [analysis])

  const filteredBiomarkers = useMemo(() => {
    if (!analysis) return []
    return analysis.biomarkers.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || b.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [analysis, searchQuery, selectedCategory])

  const stats = useMemo(() => {
    if (!analysis) return null
    return {
      optimal: analysis.biomarkers.filter((b) => b.status === 'optimal').length,
      standard: analysis.biomarkers.filter((b) => b.status === 'standard').length,
      attention: analysis.biomarkers.filter((b) => b.status === 'attention').length,
    }
  }, [analysis])

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Analyse non trouvée</p>
        <button onClick={onBack} className="mt-4 text-accent-primary hover:underline">
          Retour au tableau de bord
        </button>
      </div>
    )
  }

  const getStatusIcon = (status: Biomarker['status']) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="w-4 h-4" />
      case 'standard':
        return <Minus className="w-4 h-4" />
      case 'attention':
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getValuePosition = (biomarker: Biomarker) => {
    const { value, normalRange } = biomarker
    const range = normalRange.max - normalRange.min
    const position = ((value - normalRange.min) / range) * 100
    return Math.max(0, Math.min(100, position))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        
        <div className="flex-1">
          <h1 className="text-xl font-display font-semibold text-text-primary mb-1">
            Détails de l'analyse
          </h1>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              {analysis.fileName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(analysis.date).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-sm text-text-muted mb-2">Score global</p>
          <p className="text-3xl font-semibold text-text-primary">
            {analysis.overallScore}<span className="text-lg text-text-muted font-normal">/100</span>
          </p>
        </div>
        
        {stats && (
          <>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-sm text-text-muted mb-2">Optimal</p>
              <p className="text-3xl font-semibold text-status-optimal">{stats.optimal}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-sm text-text-muted mb-2">Standard</p>
              <p className="text-3xl font-semibold text-status-standard">{stats.standard}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <p className="text-sm text-text-muted mb-2">À surveiller</p>
              <p className="text-3xl font-semibold text-status-attention">{stats.attention}</p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h3 className="font-semibold text-text-primary mb-6">Vue d'ensemble</h3>
        <BiomarkerChart biomarkers={analysis.biomarkers} />
      </div>

      {/* Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-3">Résumé</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{analysis.summary}</p>
        </div>
        
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-3">Points clés</h3>
          <ul className="space-y-2">
            {analysis.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-1.5 flex-shrink-0" />
                <span className="text-text-secondary">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Biomarkers Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-semibold text-text-primary">
            Biomarqueurs ({analysis.biomarkers.length})
          </h3>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-surface-alt rounded-lg border border-border text-sm w-48"
              />
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-3 border-b border-border flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !selectedCategory
                ? 'bg-accent-primary text-white'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr className="bg-surface-alt">
                <th className="text-left">Biomarqueur</th>
                <th className="text-left">Valeur</th>
                <th className="text-left">Plage normale</th>
                <th className="text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredBiomarkers.map((biomarker) => (
                <tr 
                  key={biomarker.name}
                  onClick={() => setSelectedBiomarker(biomarker)}
                  className="hover:bg-surface-alt cursor-pointer transition-colors"
                >
                  <td>
                    <div>
                      <p className="font-medium text-text-primary text-sm">{biomarker.name}</p>
                      <p className="text-xs text-text-muted">{biomarker.category}</p>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-text-primary">
                      {biomarker.value} <span className="text-text-muted font-normal">{biomarker.unit}</span>
                    </span>
                  </td>
                  <td className="text-text-muted text-sm">
                    {biomarker.normalRange.min} - {biomarker.normalRange.max} {biomarker.unit}
                  </td>
                  <td>
                    <span className={`
                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                      ${biomarker.status === 'optimal' ? 'status-optimal' : ''}
                      ${biomarker.status === 'standard' ? 'status-standard' : ''}
                      ${biomarker.status === 'attention' ? 'status-attention' : ''}
                    `}>
                      {getStatusIcon(biomarker.status)}
                      {getStatusLabel(biomarker.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBiomarker && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setSelectedBiomarker(null)}
        >
          <div
            className="bg-surface rounded-xl max-w-lg w-full border border-border shadow-medium animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{selectedBiomarker.name}</h3>
                <p className="text-sm text-text-muted">{selectedBiomarker.category}</p>
              </div>
              <button
                onClick={() => setSelectedBiomarker(null)}
                className="p-1.5 rounded-lg hover:bg-surface-alt transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-text-primary">{selectedBiomarker.value}</span>
                <span className="text-text-muted">{selectedBiomarker.unit}</span>
                <span className={`
                  ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                  ${selectedBiomarker.status === 'optimal' ? 'status-optimal' : ''}
                  ${selectedBiomarker.status === 'standard' ? 'status-standard' : ''}
                  ${selectedBiomarker.status === 'attention' ? 'status-attention' : ''}
                `}>
                  {getStatusIcon(selectedBiomarker.status)}
                  {getStatusLabel(selectedBiomarker.status)}
                </span>
              </div>
              
              {/* Range bar */}
              <div className="space-y-2">
                <div className="h-2 bg-surface-alt rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-1/4 right-1/4 bg-green-100" />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow"
                    style={{
                      left: `calc(${getValuePosition(selectedBiomarker)}% - 6px)`,
                      backgroundColor: getStatusColor(selectedBiomarker.status),
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-text-muted">
                  <span>{selectedBiomarker.normalRange.min}</span>
                  <span>Plage normale</span>
                  <span>{selectedBiomarker.normalRange.max}</span>
                </div>
              </div>
              
              {selectedBiomarker.description && (
                <div className="bg-surface-alt rounded-lg p-4">
                  <p className="text-sm text-text-secondary">{selectedBiomarker.description}</p>
                </div>
              )}
              
              {selectedBiomarker.recommendation && (
                <div className="bg-accent-secondary rounded-lg p-4 border border-accent-primary/20">
                  <p className="text-sm font-medium text-accent-primary mb-1">Recommandation</p>
                  <p className="text-sm text-text-secondary">{selectedBiomarker.recommendation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
