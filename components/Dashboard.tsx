'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAppStore, getSedentaryLabel, Biomarker, getStatusColor, getStatusLabel } from '@/lib/store'
import { 
  Settings, Upload, Plus, FileText, Calendar, ChevronRight,
  TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle, Activity,
  Droplets, Heart, Pill, Flame, Beaker, Info, Dna, Sparkles, Stethoscope,
  Printer, X, Clock
} from 'lucide-react'
import FileUpload from './FileUpload'
import AnalysisView from './AnalysisView'
import SettingsPanel from './SettingsPanel'
import DNAUpload from './DNAUpload'
import DNADashboard from './DNADashboard'
import HealthPlanView from './HealthPlan'
import DoctorChat from './DoctorChat'
import PrintReport from './PrintReport'
import RecommendedAnalyses from './RecommendedAnalyses'
import FastingView from './Fasting'

type View = 'dashboard' | 'upload' | 'analysis' | 'settings' | 'dna' | 'plan' | 'analyses' | 'fasting'

// Catégories de biomarqueurs
const biomarkerCategories = [
  { id: 'all', label: 'Tous', icon: Activity },
  { id: 'lipid', label: 'Lipides', icon: Droplets },
  { id: 'liver', label: 'Foie', icon: Beaker },
  { id: 'kidney', label: 'Reins', icon: Pill },
  { id: 'blood', label: 'Sang', icon: Heart },
  { id: 'metabolic', label: 'Métabolisme', icon: Flame },
]

// Score ring component
function ScoreRing({ score, size = 100, showLabel = true }: { score: number; size?: number; showLabel?: boolean }) {
  const strokeWidth = size > 80 ? 10 : 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  
  const getColor = (score: number) => {
    if (score >= 80) return '#1e5631'
    if (score >= 60) return '#2d7a45'
    if (score >= 40) return '#d97706'
    return '#dc2626'
  }
  
  const color = getColor(score)
  
  // Taille de police adaptative
  const fontSize = size > 80 ? 'text-3xl' : size > 60 ? 'text-xl' : 'text-lg'
  const subFontSize = size > 80 ? 'text-xs' : 'text-[10px]'
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-alt"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`${fontSize} font-semibold text-text-primary leading-none`}>{score}</span>
        {showLabel && <span className={`${subFontSize} text-text-muted`}>/100</span>}
      </div>
    </div>
  )
}

// Fonction pour catégoriser les biomarqueurs
function categorizeBiomarker(name: string): string {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('cholest') || nameLower.includes('triglyc') || nameLower.includes('hdl') || nameLower.includes('ldl')) {
    return 'lipid'
  }
  if (nameLower.includes('alat') || nameLower.includes('asat') || nameLower.includes('gamma') || nameLower.includes('bilirub') || nameLower.includes('foie') || nameLower.includes('transaminase')) {
    return 'liver'
  }
  if (nameLower.includes('créat') || nameLower.includes('urée') || nameLower.includes('acide urique') || nameLower.includes('rein')) {
    return 'kidney'
  }
  if (nameLower.includes('hémoglo') || nameLower.includes('globule') || nameLower.includes('plaquette') || nameLower.includes('hématocrite') || nameLower.includes('vgm') || nameLower.includes('leucocyte') || nameLower.includes('érythrocyte')) {
    return 'blood'
  }
  if (nameLower.includes('glucose') || nameLower.includes('glyc') || nameLower.includes('hba1c') || nameLower.includes('fer') || nameLower.includes('ferritine') || nameLower.includes('transferrine')) {
    return 'metabolic'
  }
  
  return 'other'
}

// Calcul du score par catégorie
function getCategoryScore(biomarkers: Biomarker[], category: string): { score: number; status: string; count: number } {
  const filtered = category === 'all' 
    ? biomarkers 
    : biomarkers.filter(b => categorizeBiomarker(b.name) === category)
  
  if (filtered.length === 0) return { score: 0, status: 'none', count: 0 }
  
  const optimal = filtered.filter(b => b.status === 'optimal').length
  const score = Math.round((optimal / filtered.length) * 100)
  
  let status = 'attention'
  if (score >= 80) status = 'excellent'
  else if (score >= 60) status = 'good'
  else if (score >= 40) status = 'moderate'
  
  return { score, status, count: filtered.length }
}

export default function Dashboard() {
  const { profile, analyses, dnaAnalyses, healthPlan, fastingState } = useAppStore()
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showReport, setShowReport] = useState(false)
  const [modalBiomarker, setModalBiomarker] = useState<Biomarker | null>(null)
  const [showAttentionModal, setShowAttentionModal] = useState(false)
  const [fastingElapsed, setFastingElapsed] = useState(0)
  
  // Mettre à jour le temps écoulé du jeûne pour l'affichage dans le bouton
  useEffect(() => {
    if (fastingState?.isRunning && fastingState.startTime) {
      const startTime = fastingState.startTime // Capturer la valeur
      const updateElapsed = () => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        setFastingElapsed(elapsed)
      }
      // Mettre à jour immédiatement
      updateElapsed()
      // Puis mettre à jour chaque seconde
      const interval = setInterval(updateElapsed, 1000)
      return () => clearInterval(interval)
    } else {
      setFastingElapsed(0)
    }
  }, [fastingState?.isRunning, fastingState?.startTime])

  const latestAnalysis = analyses[0]
  const hasBlood = analyses.length > 0
  const hasDNA = dnaAnalyses.length > 0

  const handleViewAnalysis = (id: string) => {
    setSelectedAnalysisId(id)
    setCurrentView('analysis')
  }

  // Filtrer les biomarqueurs par catégorie
  const filteredBiomarkers = useMemo(() => {
    if (!latestAnalysis) return []
    if (activeCategory === 'all') return latestAnalysis.biomarkers
    return latestAnalysis.biomarkers.filter(b => categorizeBiomarker(b.name) === activeCategory)
  }, [latestAnalysis, activeCategory])

  // Calculer les scores par catégorie
  const categoryScores = useMemo(() => {
    if (!latestAnalysis) return {}
    return {
      lipid: getCategoryScore(latestAnalysis.biomarkers, 'lipid'),
      liver: getCategoryScore(latestAnalysis.biomarkers, 'liver'),
      kidney: getCategoryScore(latestAnalysis.biomarkers, 'kidney'),
      blood: getCategoryScore(latestAnalysis.biomarkers, 'blood'),
      metabolic: getCategoryScore(latestAnalysis.biomarkers, 'metabolic'),
    }
  }, [latestAnalysis])

  const stats = latestAnalysis ? {
    optimal: latestAnalysis.biomarkers.filter(b => b.status === 'optimal').length,
    standard: latestAnalysis.biomarkers.filter(b => b.status === 'standard').length,
    attention: latestAnalysis.biomarkers.filter(b => b.status === 'attention').length,
    total: latestAnalysis.biomarkers.length,
  } : null

  // Fonction pour trouver un biomarqueur comparable dans une analyse précédente
  const findComparableBiomarker = useCallback((biomarkerName: string, targetAnalysis: typeof latestAnalysis) => {
    if (!targetAnalysis) return null
    return targetAnalysis.biomarkers.find((b: Biomarker) => 
      b.name.toLowerCase().trim() === biomarkerName.toLowerCase().trim()
    ) || null
  }, [])

  // Calculer l'évolution d'un biomarqueur
  const getBiomarkerEvolution = useCallback((biomarker: Biomarker) => {
    if (analyses.length < 2) return null
    
    const previousAnalysis = analyses[1]
    const previousBiomarker = findComparableBiomarker(biomarker.name, previousAnalysis)
    
    if (!previousBiomarker) return null
    
    const diff = biomarker.value - previousBiomarker.value
    const diffPercent = previousBiomarker.value !== 0 
      ? ((diff / previousBiomarker.value) * 100) 
      : 0
    
    // Déterminer si l'évolution est positive ou négative selon le contexte
    // Pour certains biomarqueurs, une augmentation est bonne (HDL), pour d'autres c'est mauvais (LDL)
    const isImprovement = (() => {
      const nameLower = biomarker.name.toLowerCase()
      // Biomarqueurs où une augmentation est généralement bonne
      if (nameLower.includes('hdl') || nameLower.includes('hémoglobine') || nameLower.includes('vitamine')) {
        return diff > 0
      }
      // Biomarqueurs où une diminution est généralement bonne
      if (nameLower.includes('ldl') || nameLower.includes('cholestérol total') || nameLower.includes('triglyc') || 
          nameLower.includes('glucose') || nameLower.includes('glyc') || nameLower.includes('créatinine')) {
        return diff < 0
      }
      // Par défaut, on considère qu'être dans la plage normale est mieux
      const wasInRange = previousBiomarker.value >= previousBiomarker.normalRange.min && 
                        previousBiomarker.value <= previousBiomarker.normalRange.max
      const isInRange = biomarker.value >= biomarker.normalRange.min && 
                        biomarker.value <= biomarker.normalRange.max
      if (!wasInRange && isInRange) return true
      if (wasInRange && !isInRange) return false
      // Si les deux sont dans la plage, on compare la distance au centre
      const center = (biomarker.normalRange.min + biomarker.normalRange.max) / 2
      const prevDistance = Math.abs(previousBiomarker.value - center)
      const currDistance = Math.abs(biomarker.value - center)
      return currDistance < prevDistance
    })()
    
    return {
      previousValue: previousBiomarker.value,
      previousStatus: previousBiomarker.status,
      diff,
      diffPercent: Math.abs(diffPercent),
      isImprovement,
      hasEvolution: Math.abs(diff) > 0.01, // Seuil minimal pour considérer une évolution
    }
  }, [analyses, findComparableBiomarker])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="font-display text-2xl font-semibold text-accent-primary-light tracking-tight">Vitea</span>
            </div>
            
            <nav className="flex items-center gap-1">
              {/* Bouton Imprimer rapport - visible si au moins une analyse */}
              {(hasBlood || hasDNA) && (
                <button
                  onClick={() => setShowReport(true)}
                  className="group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt"
                >
                  <Printer className="w-4 h-4" />
                  <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    Générer un rapport PDF
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                  </span>
                </button>
              )}
              
              <div className="w-px h-6 bg-border mx-1" />
              
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  currentView === 'dashboard' 
                    ? 'bg-accent-secondary text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                <Droplets className="w-4 h-4" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Sang
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
              <button
                onClick={() => setCurrentView('dna')}
                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  currentView === 'dna' 
                    ? 'bg-accent-secondary text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                <Dna className="w-4 h-4" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  ADN
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
              <button
                onClick={() => setCurrentView('analyses')}
                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  currentView === 'analyses' 
                    ? 'bg-accent-secondary text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Mes analyses
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
              <button
                onClick={() => (hasBlood && hasDNA ? setCurrentView('plan') : null)}
                disabled={!hasBlood || !hasDNA}
                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  currentView === 'plan' 
                    ? 'bg-accent-secondary text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                } ${!hasBlood || !hasDNA ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {!hasBlood || !hasDNA ? 'Requiert analyse sang + ADN' : 'Mon plan'}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
              <button
                onClick={() => setCurrentView('fasting')}
                className={`group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  currentView === 'fasting' 
                    ? 'bg-accent-secondary text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                <Clock className="w-4 h-4" />
                {fastingState?.isRunning && fastingElapsed > 0 && (() => {
                  const hours = Math.floor(fastingElapsed / 3600)
                  const minutes = Math.floor((fastingElapsed % 3600) / 60)
                  return (
                    <span className="px-2 py-0.5 bg-accent-primary/20 text-accent-primary rounded text-xs font-mono">
                      {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
                    </span>
                  )
                })()}
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Fasting
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
              <button
                onClick={() => {
                  const width = 900
                  const height = 700
                  const left = (window.screen.width - width) / 2
                  const top = (window.screen.height - height) / 2
                  window.open(
                    '/chat',
                    'DrViteaChat',
                    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
                  )
                }}
                className="group relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt"
              >
                <Stethoscope className="w-4 h-4" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Dr. AI
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`group relative p-2 rounded-lg transition-colors ${
                  currentView === 'settings' 
                    ? 'bg-accent-secondary text-accent-primary' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-text-primary text-background text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  Paramètres
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-text-primary"></span>
                </span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-display font-semibold text-text-primary mb-1">
                  Bonjour, {profile?.firstName}
                </h1>
                <p className="text-text-secondary">
                  {latestAnalysis 
                    ? `Dernière analyse le ${new Date(latestAnalysis.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                    : 'Commencez par importer vos résultats de prise de sang'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-8">
                {profile && (
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-text-muted">Profil</span>
                      <p className="font-medium text-text-primary">{profile.age} ans · {profile.weight} kg</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div>
                      <span className="text-text-muted">Activité</span>
                      <p className="font-medium text-text-primary">{getSedentaryLabel(profile.sedentaryLevel)}</p>
                    </div>
                  </div>
                )}
                {latestAnalysis && (
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle analyse
                  </button>
                )}
              </div>
            </div>

            {/* Empty State */}
            {!latestAnalysis && (
              <div className="bg-surface border border-border rounded-xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent-secondary flex items-center justify-center mx-auto mb-5">
                  <Upload className="w-8 h-8 text-accent-primary" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Aucune analyse
                </h2>
                <p className="text-text-secondary mb-6 max-w-sm mx-auto">
                  Importez vos résultats de prise de sang au format PDF ou image pour obtenir une analyse détaillée.
                </p>
                <button
                  onClick={() => setCurrentView('upload')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  Nouvelle analyse
                </button>
              </div>
            )}


            {/* Score Global */}
            {latestAnalysis && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary mb-1">Score de santé global</h3>
                    <p className="text-text-secondary text-sm mb-4">Basé sur {stats?.total} biomarqueurs analysés</p>
                    
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-optimal"></div>
                        <span className="text-sm text-text-secondary">{stats?.optimal} optimal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-standard"></div>
                        <span className="text-sm text-text-secondary">{stats?.standard} standard</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-status-attention"></div>
                        <span className="text-sm text-text-secondary">{stats?.attention} à surveiller</span>
                      </div>
                    </div>
                  </div>
                  <ScoreRing score={latestAnalysis.overallScore} size={120} />
                </div>
              </div>
            )}

            {/* Category Cards + Additional Widgets */}
            {latestAnalysis && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {biomarkerCategories.slice(1).map((cat) => {
                  const catScore = categoryScores[cat.id as keyof typeof categoryScores]
                  if (!catScore || catScore.count === 0) return null
                  
                  const Icon = cat.icon
                  const statusColors: Record<string, string> = {
                    excellent: '#1e5631',
                    good: '#2d7a45',
                    moderate: '#d97706',
                    attention: '#dc2626',
                  }
                  const statusLabels: Record<string, string> = {
                    excellent: 'Excellent',
                    good: 'Bon',
                    moderate: 'Modéré',
                    attention: 'À surveiller',
                  }
                  
                  return (
                    <div key={cat.id} className="bg-surface border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary">{cat.label}</h4>
                            <span 
                              className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: `${statusColors[catScore.status]}15`,
                                color: statusColors[catScore.status]
                              }}
                            >
                              {statusLabels[catScore.status]}
                            </span>
                          </div>
                        </div>
                        <ScoreRing score={catScore.score} size={56} showLabel={false} />
                      </div>
                      
                      <p className="text-sm text-text-muted">
                        {catScore.count} biomarqueur{catScore.count > 1 ? 's' : ''} analysé{catScore.count > 1 ? 's' : ''}
                      </p>
                    </div>
                  )
                })}
                
                {/* Widget: Biomarqueurs à surveiller */}
                {stats && stats.attention > 0 && (
                  <div 
                    className="bg-red-50 border border-red-200 rounded-xl p-5 cursor-pointer hover:border-red-300 transition-all hover:shadow-md"
                    onClick={() => setShowAttentionModal(true)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-status-attention" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">À surveiller</h4>
                        <span className="text-xs text-status-attention font-medium">
                          {stats.attention} biomarqueur{stats.attention > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {latestAnalysis.biomarkers
                        .filter(b => b.status === 'attention')
                        .slice(0, 3)
                        .map((b, i) => (
                          <li key={`${b.name}-${i}`} className="text-sm text-text-secondary flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-status-attention flex-shrink-0" />
                            <span className="truncate">{b.name}</span>
                          </li>
                        ))}
                      {stats.attention > 3 && (
                        <li className="text-sm text-status-attention font-medium pt-1">
                          +{stats.attention - 3} autre{stats.attention - 3 > 1 ? 's' : ''}...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {/* Widget: Date & Infos analyse */}
                <div className="bg-surface border border-border rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">Dernière analyse</h4>
                      <span className="text-xs text-text-muted">
                        {new Date(latestAnalysis.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-surface-alt rounded-lg">
                      <p className="text-2xl font-semibold text-text-primary">{stats?.total}</p>
                      <p className="text-xs text-text-muted">Biomarqueurs</p>
                    </div>
                    <div className="text-center p-3 bg-surface-alt rounded-lg">
                      <p className="text-2xl font-semibold text-text-primary">{analyses.length}</p>
                      <p className="text-xs text-text-muted">Analyses</p>
                    </div>
                  </div>
                </div>
                
                {/* Widget: Évolution (si plusieurs analyses) */}
                {analyses.length > 1 && (() => {
                  const previousAnalysis = analyses[1]
                  const diff = latestAnalysis.overallScore - previousAnalysis.overallScore
                  const isPositive = diff >= 0
                  
                  // Compter les biomarqueurs améliorés/détériorés
                  const improvedBiomarkers = latestAnalysis.biomarkers.filter(b => {
                    const prev = findComparableBiomarker(b.name, previousAnalysis)
                    if (!prev) return false
                    const evolution = getBiomarkerEvolution(b)
                    return evolution?.isImprovement && evolution.hasEvolution
                  }).length
                  
                  const worsenedBiomarkers = latestAnalysis.biomarkers.filter(b => {
                    const prev = findComparableBiomarker(b.name, previousAnalysis)
                    if (!prev) return false
                    const evolution = getBiomarkerEvolution(b)
                    return evolution && !evolution.isImprovement && evolution.hasEvolution
                  }).length
                  
                  const comparableCount = latestAnalysis.biomarkers.filter(b => 
                    findComparableBiomarker(b.name, previousAnalysis) !== null
                  ).length
                  
                  return (
                    <div className="bg-surface border border-border rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-text-primary">Évolution globale</h4>
                          <span className="text-xs text-text-muted">vs analyse précédente</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1 text-lg font-semibold ${isPositive ? 'text-status-optimal' : 'text-status-attention'}`}>
                            {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                            {isPositive ? '+' : ''}{diff} pts
                          </div>
                          <span className="text-sm text-text-muted">
                            {previousAnalysis.overallScore} → {latestAnalysis.overallScore}
                          </span>
                        </div>
                        {comparableCount > 0 && (
                          <div className="pt-3 border-t border-border space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-muted">Biomarqueurs améliorés</span>
                              <span className="font-medium text-status-optimal">{improvedBiomarkers}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-muted">Biomarqueurs détériorés</span>
                              <span className="font-medium text-status-attention">{worsenedBiomarkers}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-text-muted">Comparables</span>
                              <span className="font-medium text-text-primary">{comparableCount}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Summary - Full Width */}
            {latestAnalysis && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Résumé de votre analyse</h3>
                    <p className="text-xs text-text-muted">Explication détaillée de vos résultats</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  {latestAnalysis.summary.split('\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="text-text-secondary leading-relaxed mb-3 last:mb-0">
                        {paragraph}
                      </p>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {latestAnalysis && latestAnalysis.insights.length > 0 && (
              <div className="bg-surface border border-border rounded-xl p-6">
                <h3 className="font-semibold text-text-primary mb-4">Points clés à retenir</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {latestAnalysis.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-surface-alt rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-accent-secondary flex items-center justify-center text-accent-primary text-xs font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-text-secondary text-sm">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {latestAnalysis && latestAnalysis.recommendations.length > 0 && (
              <div className="bg-accent-secondary border border-accent-primary/20 rounded-xl p-6">
                <h3 className="font-semibold text-accent-primary mb-4">
                  Recommandations personnalisées
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {latestAnalysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 bg-surface rounded-lg p-4 border border-border">
                      <CheckCircle className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-text-secondary">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Filter */}
            {latestAnalysis && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {biomarkerCategories.map((cat) => {
                  const Icon = cat.icon
                  const count = cat.id === 'all' 
                    ? latestAnalysis.biomarkers.length 
                    : latestAnalysis.biomarkers.filter(b => categorizeBiomarker(b.name) === cat.id).length
                  
                  if (count === 0 && cat.id !== 'all') return null
                  
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeCategory === cat.id
                          ? 'bg-accent-secondary text-accent-primary'
                          : 'text-text-secondary hover:bg-surface-alt'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.label}
                      <span className="text-xs opacity-60">({count})</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Biomarkers Grid */}
            {latestAnalysis && filteredBiomarkers.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredBiomarkers.map((biomarker, idx) => {
                  const isInRange = biomarker.value >= biomarker.normalRange.min && biomarker.value <= biomarker.normalRange.max
                  const percentInRange = ((biomarker.value - biomarker.normalRange.min) / (biomarker.normalRange.max - biomarker.normalRange.min)) * 100
                  const evolution = getBiomarkerEvolution(biomarker)
                  
                  return (
                    <div 
                      key={`${biomarker.name}-${idx}`} 
                      className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-accent-primary/50 transition-all hover:shadow-md"
                      onClick={() => setModalBiomarker(biomarker)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary truncate">{biomarker.name}</p>
                            {evolution && evolution.hasEvolution && (
                              <div className={`flex items-center gap-1 ${evolution.isImprovement ? 'text-status-optimal' : 'text-status-attention'}`}>
                                {evolution.isImprovement ? (
                                  <TrendingUp className="w-3.5 h-3.5" />
                                ) : (
                                  <TrendingDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-text-muted">{biomarker.category}</p>
                        </div>
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium ml-2 flex-shrink-0"
                          style={{ 
                            backgroundColor: `${getStatusColor(biomarker.status)}15`,
                            color: getStatusColor(biomarker.status)
                          }}
                        >
                          {getStatusLabel(biomarker.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-semibold text-text-primary">{biomarker.value}</span>
                        <span className="text-sm text-text-muted">{biomarker.unit}</span>
                        {evolution && evolution.hasEvolution && (
                          <span className={`text-xs font-medium ml-2 ${evolution.isImprovement ? 'text-status-optimal' : 'text-status-attention'}`}>
                            {evolution.isImprovement ? '+' : ''}{evolution.diff.toFixed(evolution.diff % 1 === 0 ? 0 : 1)} {biomarker.unit}
                          </span>
                        )}
                      </div>
                      {evolution && evolution.hasEvolution && (
                        <div className="text-xs text-text-muted mb-2">
                          vs {evolution.previousValue.toFixed(evolution.previousValue % 1 === 0 ? 0 : 1)} {biomarker.unit} ({new Date(analyses[1].date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })})
                        </div>
                      )}
                      
                      {/* Range indicator */}
                      <div className="relative">
                        <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(Math.max(percentInRange, 0), 100)}%`,
                              backgroundColor: getStatusColor(biomarker.status)
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-text-muted">{biomarker.normalRange.min}</span>
                          <span className="text-xs text-text-muted">{biomarker.normalRange.max} {biomarker.unit}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* History */}
            {analyses.length > 1 && (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-text-primary">Historique</h3>
                  <span className="text-sm text-text-muted">{analyses.length} analyse(s)</span>
                </div>
                
                <div className="divide-y divide-border">
                  {analyses.map((analysis) => (
                    <button
                      key={analysis.id}
                      onClick={() => handleViewAnalysis(analysis.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-surface-alt transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">{analysis.fileName}</p>
                        <p className="text-sm text-text-muted flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(analysis.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                          <span>·</span>
                          {analysis.biomarkers.length} biomarqueurs
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-semibold text-text-primary">{analysis.overallScore}</p>
                        <p className="text-xs text-text-muted">Score</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'upload' && (
          <div className="animate-fade-in">
            <FileUpload onComplete={() => setCurrentView('dashboard')} />
          </div>
        )}

        {currentView === 'analysis' && selectedAnalysisId && (
          <div className="animate-fade-in">
            <AnalysisView 
              analysisId={selectedAnalysisId} 
              onBack={() => setCurrentView('dashboard')}
            />
          </div>
        )}

        {currentView === 'settings' && (
          <div className="animate-fade-in">
            <SettingsPanel />
          </div>
        )}

        {currentView === 'plan' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Sparkles className="w-7 h-7 text-accent-primary" />
                  Mon plan
                </h1>
                <p className="text-text-secondary">
                  Plan hebdomadaire combinant vos résultats de sang et d'ADN
                </p>
              </div>
            </div>
            
            <HealthPlanView />
          </div>
        )}

        {currentView === 'dna' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Dna className="w-7 h-7 text-accent-primary" />
                  Analyse ADN
                </h1>
                <p className="text-text-secondary">
                  Importez votre fichier ADN brut pour découvrir vos prédispositions génétiques
                </p>
              </div>
            </div>
            
            <DNAUpload />
            <DNADashboard />
          </div>
        )}

        {currentView === 'analyses' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Calendar className="w-7 h-7 text-accent-primary" />
                  Mes analyses
                </h1>
                <p className="text-text-secondary">
                  Analyses médicales recommandées selon votre profil et vos résultats
                </p>
              </div>
            </div>
            
            <RecommendedAnalyses />
          </div>
        )}

        {currentView === 'fasting' && (
          <FastingView />
        )}

      </main>

      {/* Print Report Modal */}
      {showReport && <PrintReport onClose={() => setShowReport(false)} />}

      {/* Biomarker Detail Modal */}
      {modalBiomarker && latestAnalysis && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setModalBiomarker(null)}
        >
            <div
              className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${getStatusColor(modalBiomarker.status)}15`,
                    }}
                  >
                    <Activity className="w-6 h-6" style={{ color: getStatusColor(modalBiomarker.status) }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">{modalBiomarker.name}</h2>
                    <p className="text-sm text-text-muted">{modalBiomarker.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalBiomarker(null)}
                  className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Value and Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-semibold text-text-primary">{modalBiomarker.value}</span>
                      <span className="text-lg text-text-muted">{modalBiomarker.unit}</span>
                      {(() => {
                        const evolution = getBiomarkerEvolution(modalBiomarker)
                        if (!evolution || !evolution.hasEvolution) return null
                        return (
                          <div className={`flex items-center gap-1 ml-2 ${evolution.isImprovement ? 'text-status-optimal' : 'text-status-attention'}`}>
                            {evolution.isImprovement ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">
                              {evolution.isImprovement ? '+' : ''}{evolution.diff.toFixed(evolution.diff % 1 === 0 ? 0 : 1)} {modalBiomarker.unit}
                            </span>
                          </div>
                        )
                      })()}
                    </div>
                    <span 
                      className="inline-block px-3 py-1 rounded-lg text-sm font-medium"
                      style={{ 
                        backgroundColor: `${getStatusColor(modalBiomarker.status)}15`,
                        color: getStatusColor(modalBiomarker.status)
                      }}
                    >
                      {getStatusLabel(modalBiomarker.status)}
                    </span>
                  </div>
                </div>

                {/* Evolution Section */}
                {(() => {
                  const evolution = getBiomarkerEvolution(modalBiomarker)
                  return evolution && evolution.hasEvolution && analyses.length > 1 && (
                  <div className={`bg-surface-alt rounded-lg p-4 border ${evolution.isImprovement ? 'border-status-optimal/30' : 'border-status-attention/30'}`}>
                    <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                      {evolution.isImprovement ? (
                        <TrendingUp className="w-5 h-5 text-status-optimal" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-status-attention" />
                      )}
                      Évolution depuis la dernière analyse
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Valeur précédente</span>
                        <span className="text-sm font-medium text-text-primary">
                          {evolution.previousValue.toFixed(evolution.previousValue % 1 === 0 ? 0 : 1)} {modalBiomarker.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Valeur actuelle</span>
                        <span className="text-sm font-medium text-text-primary">
                          {modalBiomarker.value.toFixed(modalBiomarker.value % 1 === 0 ? 0 : 1)} {modalBiomarker.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-sm font-medium text-text-primary">Variation</span>
                        <span className={`text-sm font-semibold ${evolution.isImprovement ? 'text-status-optimal' : 'text-status-attention'}`}>
                          {evolution.isImprovement ? '+' : ''}{evolution.diff.toFixed(evolution.diff % 1 === 0 ? 0 : 1)} {modalBiomarker.unit} ({evolution.diffPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Statut précédent</span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded font-medium"
                          style={{ 
                            backgroundColor: `${getStatusColor(evolution.previousStatus)}15`,
                            color: getStatusColor(evolution.previousStatus)
                          }}
                        >
                          {getStatusLabel(evolution.previousStatus)}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-2">
                        Analyse du {new Date(analyses[1].date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  )
                })()}

              {/* Range */}
              <div className="bg-surface-alt rounded-lg p-4">
                <h3 className="font-semibold text-text-primary mb-3">Plage de référence</h3>
                <div className="relative">
                  <div className="h-3 bg-surface rounded-full overflow-hidden">
                    {(() => {
                      const range = modalBiomarker.normalRange.max - modalBiomarker.normalRange.min
                      const percentInRange = ((modalBiomarker.value - modalBiomarker.normalRange.min) / range) * 100
                      const width = Math.min(Math.max(percentInRange, 0), 100)
                      return (
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${width}%`,
                            backgroundColor: getStatusColor(modalBiomarker.status)
                          }}
                        />
                      )
                    })()}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-text-muted">
                      Min: {modalBiomarker.normalRange.min} {modalBiomarker.unit}
                    </span>
                    <span className="text-sm text-text-muted">
                      Max: {modalBiomarker.normalRange.max} {modalBiomarker.unit}
                    </span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-sm font-medium text-text-primary">
                      Votre valeur: {modalBiomarker.value} {modalBiomarker.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {modalBiomarker.description && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">Description</h3>
                  <p className="text-text-secondary leading-relaxed">{modalBiomarker.description}</p>
                </div>
              )}

              {/* Recommendation */}
              {modalBiomarker.recommendation && (
                <div className="bg-accent-secondary/30 border border-accent-primary/20 rounded-lg p-4">
                  <h3 className="font-semibold text-accent-primary mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Recommandation
                  </h3>
                  <p className="text-text-secondary leading-relaxed">{modalBiomarker.recommendation}</p>
                </div>
              )}

              {/* Analysis Info */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-text-muted">
                  Analyse du {new Date(latestAnalysis.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attention Biomarkers Modal */}
      {showAttentionModal && latestAnalysis && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowAttentionModal(false)}
        >
          <div
            className="bg-surface rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-status-attention" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Biomarqueurs à surveiller</h2>
                  <p className="text-sm text-text-muted">
                    {latestAnalysis.biomarkers.filter(b => b.status === 'attention').length} biomarqueur{latestAnalysis.biomarkers.filter(b => b.status === 'attention').length > 1 ? 's' : ''} nécessitant une attention
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAttentionModal(false)}
                className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {latestAnalysis.biomarkers
                .filter(b => b.status === 'attention')
                .map((biomarker, index) => {
                  const percentInRange = ((biomarker.value - biomarker.normalRange.min) / (biomarker.normalRange.max - biomarker.normalRange.min)) * 100
                  
                  return (
                    <div key={`${biomarker.name}-${index}`} className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary mb-1">{biomarker.name}</h3>
                          <p className="text-xs text-text-muted mb-2">{biomarker.category}</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-status-attention">{biomarker.value}</span>
                            <span className="text-sm text-text-muted">{biomarker.unit}</span>
                          </div>
                        </div>
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                          style={{ 
                            backgroundColor: `${getStatusColor(biomarker.status)}15`,
                            color: getStatusColor(biomarker.status)
                          }}
                        >
                          {getStatusLabel(biomarker.status)}
                        </span>
                      </div>
                      
                      {/* Range indicator */}
                      <div className="mb-3">
                        <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(Math.max(percentInRange, 0), 100)}%`,
                              backgroundColor: getStatusColor(biomarker.status)
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-text-muted">
                          <span>{biomarker.normalRange.min}</span>
                          <span>{biomarker.normalRange.max} {biomarker.unit}</span>
                        </div>
                      </div>

                      {biomarker.description && (
                        <p className="text-sm text-text-secondary mb-2">{biomarker.description}</p>
                      )}

                      {biomarker.recommendation && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <p className="text-sm text-status-attention flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span><strong>Recommandation:</strong> {biomarker.recommendation}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
