'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  useAppStore,
  HealthPlan,
  AnalysisResult,
  DNAAnalysisResult,
} from '@/lib/store'
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Apple,
  UtensilsCrossed,
  Droplet,
  Pill,
  Heart,
  Dumbbell,
  Activity,
  Moon,
  Brain,
  HeartPulse,
  Leaf,
  Coffee,
  Music,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  Flame,
  Waves,
  Sun,
  Wind,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Printer,
} from 'lucide-react'

// Spotify playlists recommendations based on behavior goals
const spotifyPlaylists = {
  focus: [
    { 
      name: 'Deep Focus', 
      id: '37i9dQZF1DWZeKCadgRdKQ', 
      description: 'Concentration intense',
      icon: '🎯',
      color: 'blue'
    },
    { 
      name: 'Brain Food', 
      id: '37i9dQZF1DXLeA8Omikj7', 
      description: 'Productivité mentale',
      icon: '🧠',
      color: 'indigo'
    },
  ],
  relaxation: [
    { 
      name: 'Peaceful Piano', 
      id: '37i9dQZF1DX4sWSpwq3LiO', 
      description: 'Calme et sérénité',
      icon: '🎹',
      color: 'purple'
    },
    { 
      name: 'Sleep', 
      id: '37i9dQZF1DWZd79rJ6a7lp', 
      description: 'Endormissement',
      icon: '🌙',
      color: 'slate'
    },
  ],
  meditation: [
    { 
      name: 'Meditation Moments', 
      id: '37i9dQZF1DX9uKNf5jGX6m', 
      description: 'Méditation guidée',
      icon: '🧘',
      color: 'violet'
    },
  ],
  workout: [
    { 
      name: 'Beast Mode', 
      id: '37i9dQZF1DX76Wlfdnj7AP', 
      description: 'Entraînement intense',
      icon: '💪',
      color: 'red'
    },
    { 
      name: 'Workout', 
      id: '37i9dQZF1DX70RN3TfWWJh', 
      description: 'Cardio & fitness',
      icon: '🏃',
      color: 'orange'
    },
  ],
  morning: [
    { 
      name: 'Morning Motivation', 
      id: '37i9dQZF1DX70RN3TfWWJh', 
      description: 'Réveil énergique',
      icon: '☀️',
      color: 'yellow'
    },
  ],
  evening: [
    { 
      name: 'Evening Acoustic', 
      id: '37i9dQZF1DX4E3UdUs7fUx', 
      description: 'Détente du soir',
      icon: '🌆',
      color: 'amber'
    },
  ],
}

function getRecommendedPlaylists(behavior: HealthPlan['behavior'] | undefined) {
  if (!behavior) return []
  
  const recommended: typeof spotifyPlaylists.focus = []
  const allBehaviors = [
    ...(behavior.sleep || []),
    ...(behavior.stress || []),
    ...(behavior.recovery || []),
    ...(behavior.mindfulness || []),
    ...(behavior.other || []),
  ].join(' ').toLowerCase()
  
  if (allBehaviors.includes('méditation') || allBehaviors.includes('respiration')) {
    recommended.push(...spotifyPlaylists.meditation)
  }
  if (allBehaviors.includes('sommeil') || allBehaviors.includes('dormir')) {
    recommended.push(...spotifyPlaylists.relaxation)
  }
  if (allBehaviors.includes('focus') || allBehaviors.includes('concentration')) {
    recommended.push(...spotifyPlaylists.focus)
  }
  if (allBehaviors.includes('matin') || allBehaviors.includes('énergie')) {
    recommended.push(...spotifyPlaylists.morning)
  }
  if (allBehaviors.includes('soir') || allBehaviors.includes('détente')) {
    recommended.push(...spotifyPlaylists.evening)
  }
  
  if (recommended.length === 0) {
    recommended.push(...spotifyPlaylists.relaxation, ...spotifyPlaylists.focus.slice(0, 1))
  }
  
  const unique = recommended.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
  return unique.slice(0, 4)
}

// Weight Progression Chart Component
function WeightProgressionChart({ 
  progression, 
  currentWeight, 
  targetWeight 
}: { 
  progression: Array<{ week: number; targetWeight: number; milestone: string }>
  currentWeight: number
  targetWeight: number
}) {
  if (!progression || progression.length === 0) return null

  const chartHeight = 320
  const chartPadding = { top: 30, right: 30, bottom: 70, left: 60 }
  const chartWidth = 800
  const innerWidth = chartWidth - chartPadding.left - chartPadding.right
  const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom

  // Calculate weight range with better margins
  const weights = progression.map(p => p.targetWeight)
  const minWeight = Math.min(...weights, currentWeight, targetWeight) - 3
  const maxWeight = Math.max(...weights, currentWeight, targetWeight) + 3
  const weightRange = maxWeight - minWeight

  // Scale functions
  const scaleX = (week: number) => {
    const maxWeek = Math.max(...progression.map(p => p.week))
    return chartPadding.left + (week / maxWeek) * innerWidth
  }

  const scaleY = (weight: number) => {
    return chartPadding.top + innerHeight - ((weight - minWeight) / weightRange) * innerHeight
  }

  // Generate path for the curve
  const points = progression.map(p => ({
    x: scaleX(p.week),
    y: scaleY(p.targetWeight),
    week: p.week,
    weight: p.targetWeight,
    milestone: p.milestone,
  }))

  // Create smooth cubic bezier curve
  const createSmoothPath = (pathPoints: Array<{ x: number; y: number }>) => {
    if (pathPoints.length === 0) return ''
    if (pathPoints.length === 1) return `M ${pathPoints[0].x} ${pathPoints[0].y}`
    
    let path = `M ${pathPoints[0].x} ${pathPoints[0].y}`
    
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const current = pathPoints[i]
      const next = pathPoints[i + 1]
      
      // Calculate control points for smooth curve
      const dx = next.x - current.x
      const dy = next.y - current.y
      
      const cp1x = current.x + dx * 0.4
      const cp1y = current.y
      const cp2x = next.x - dx * 0.4
      const cp2y = next.y
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`
    }
    
    return path
  }

  const pathData = createSmoothPath(points)
  
  // Create area path (for gradient fill)
  const areaPath = pathData + ` L ${points[points.length - 1].x} ${chartPadding.top + innerHeight} L ${points[0].x} ${chartPadding.top + innerHeight} Z`
  
  // Target weight line position
  const targetY = scaleY(targetWeight)

  return (
    <div className="w-full">
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for area fill */}
          <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
          
          {/* Gradient for line */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
            <feOffset dx="0" dy="2" result="offsetblur"/>
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3"/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines - horizontal */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const y = chartPadding.top + (i / 5) * innerHeight
          return (
            <line
              key={`grid-h-${i}`}
              x1={chartPadding.left}
              y1={y}
              x2={chartWidth - chartPadding.right}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={1}
              strokeDasharray={i % 2 === 0 ? "0" : "4,4"}
            />
          )
        })}

        {/* Grid lines - vertical (for milestones) */}
        {points.map((point, index) => {
          if (index === 0 || index === points.length - 1) return null
          return (
            <line
              key={`grid-v-${index}`}
              x1={point.x}
              y1={chartPadding.top}
              x2={point.x}
              y2={chartPadding.top + innerHeight}
              stroke="currentColor"
              strokeOpacity={0.05}
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          )
        })}

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4, 5].map(i => {
          const weight = maxWeight - (i / 5) * weightRange
          const y = chartPadding.top + (i / 5) * innerHeight
          return (
            <g key={`y-label-${i}`}>
              <line
                x1={chartPadding.left - 5}
                y1={y}
                x2={chartPadding.left}
                y2={y}
                stroke="currentColor"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              <text
                x={chartPadding.left - 12}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-text-muted font-medium"
              >
                {weight.toFixed(1)}kg
              </text>
            </g>
          )
        })}

        {/* Target weight line */}
        <line
          x1={chartPadding.left}
          y1={targetY}
          x2={chartWidth - chartPadding.right}
          y2={targetY}
          stroke="currentColor"
          strokeWidth={2}
          strokeDasharray="6,4"
          className="text-status-optimal"
          opacity={0.6}
        />
        <text
          x={chartWidth - chartPadding.right + 8}
          y={targetY + 4}
          className="text-xs fill-status-optimal font-semibold"
        >
          Objectif: {targetWeight}kg
        </text>

        {/* Area fill under curve */}
        <path
          d={areaPath}
          fill="url(#weightGradient)"
          className="text-accent-primary"
        />

        {/* Main curve */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          className="text-accent-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#shadow)"
        />

        {/* Points with hover effect */}
        {points.map((point, index) => (
          <g key={`point-${index}`} className="cursor-pointer group">
            {/* Outer circle for hover */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="currentColor"
              className="text-accent-primary opacity-0 group-hover:opacity-20 transition-opacity"
            />
            {/* Main point circle */}
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-accent-primary"
            />
            {/* Inner dot */}
            <circle
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill="currentColor"
              className="text-accent-primary"
            />
            {/* Tooltip on hover */}
            <title>
              Semaine {point.week}: {point.weight.toFixed(1)}kg - {point.milestone}
            </title>
          </g>
        ))}

        {/* X-axis line */}
        <line
          x1={chartPadding.left}
          y1={chartPadding.top + innerHeight}
          x2={chartWidth - chartPadding.right}
          y2={chartPadding.top + innerHeight}
          stroke="currentColor"
          strokeWidth={2}
          className="text-text-muted"
          opacity={0.3}
        />

        {/* X-axis labels */}
        {points.map((point, index) => (
          <g key={`xlabel-${index}`}>
            <line
              x1={point.x}
              y1={chartPadding.top + innerHeight}
              x2={point.x}
              y2={chartPadding.top + innerHeight + 5}
              stroke="currentColor"
              strokeWidth={2}
              className="text-text-muted"
              opacity={0.3}
            />
            <text
              x={point.x}
              y={chartHeight - chartPadding.bottom + 20}
              textAnchor="middle"
              className="text-xs fill-text-muted font-medium"
            >
              S{point.week}
            </text>
            {point.milestone && (
              <text
                x={point.x}
                y={chartHeight - chartPadding.bottom + 35}
                textAnchor="middle"
                className="text-xs fill-text-secondary font-semibold"
              >
                {point.milestone}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full bg-accent-primary"></div>
          <span className="text-text-secondary font-medium">Progression</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-status-optimal"></div>
          <span className="text-text-secondary font-medium">Objectif: {targetWeight}kg</span>
        </div>
      </div>
    </div>
  )
}

export default function HealthPlanView() {
  const { analyses, dnaAnalyses, profile, healthPlan, setHealthPlan, toggleDailyTodoCompleted } = useAppStore()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)
  
  // State for collapsed sections (all open by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    summary: false,
    dailyTodos: false,
    weightManagement: false,
    nutrition: false,
    fitness: false,
    behavior: false,
    insights: false,
  })
  
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }
  
  // Calculate completed todos count from healthPlan
  const completedTodosCount = healthPlan?.dailyTodos?.filter(todo => todo.completed).length || 0

  const loadingMessages = [
    "Analyse de vos résultats sanguins...",
    "Analyse de vos prédispositions ADN...",
    "Croisement des données sang + ADN...",
    "Construction d'un plan nutrition personnalisé...",
    "Sélection d'exercices adaptés...",
    "Génération des conseils comportementaux...",
    "Finalisation du plan personnalisé...",
  ]

  useEffect(() => {
    if (!isLoading) return
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoading])

  const latestBlood: AnalysisResult | undefined = analyses[0]
  const latestDNA: DNAAnalysisResult | undefined = dnaAnalyses[0]
  const canGenerate = Boolean(profile?.openaiKey && latestBlood && latestDNA)

  const recommendedPlaylists = useMemo(() => 
    getRecommendedPlaylists(healthPlan?.behavior), 
    [healthPlan?.behavior]
  )

  const handleGenerate = async () => {
    if (!canGenerate) return
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodAnalysis: latestBlood,
          dnaAnalysis: latestDNA,
          profile,
          apiKey: profile?.openaiKey,
        }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Erreur lors de la génération du plan')
      }
      const plan: HealthPlan = await response.json()
      setHealthPlan({
        ...plan,
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
      })
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération du plan')
    } finally {
      setIsLoading(false)
    }
  }

  // Full screen loader
  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            Génération en cours
          </h2>
          <p className="text-text-secondary mb-6">
            {loadingMessages[loadingMessageIndex]}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Warnings */}
      {(!latestBlood || !latestDNA) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Analyses requises</p>
            <p className="text-amber-700 text-sm mt-1">
              Importez une analyse de sang et une analyse ADN pour générer votre plan personnalisé.
            </p>
          </div>
        </div>
      )}

      {!profile?.openaiKey && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Clé API OpenAI requise</p>
            <p className="text-amber-700 text-sm mt-1">
              Ajoutez votre clé dans les paramètres pour générer le plan.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm">
            {healthPlan 
              ? `Généré le ${new Date(healthPlan.generatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Plan basé sur vos analyses sang et ADN'
            }
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary text-white font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {healthPlan ? 'Régénérer' : 'Générer le plan'}
        </button>
      </div>

      {/* Empty state */}
      {!healthPlan && canGenerate && (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <Sparkles className="w-12 h-12 text-accent-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Prêt à générer votre plan</h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Cliquez sur "Générer le plan" pour créer un programme personnalisé combinant vos analyses de sang et votre profil génétique.
          </p>
        </div>
      )}

      {healthPlan && (
        <div className="space-y-8">
          {/* Summary */}
          {healthPlan.summary && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <button
                onClick={() => toggleSection('summary')}
                className="w-full flex items-center justify-between gap-3 mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">Votre plan personnalisé</h2>
                </div>
                {collapsedSections.summary ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                )}
              </button>
              {!collapsedSections.summary && (
                <p className="text-text-secondary leading-relaxed pl-1">{healthPlan.summary}</p>
              )}
            </section>
          )}

          {/* Daily Todos */}
          {healthPlan.dailyTodos && healthPlan.dailyTodos.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => toggleSection('dailyTodos')}
                  className="flex-1 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-accent-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h2 className="text-xl font-semibold text-text-primary text-left">Todo du jour</h2>
                      <p className="text-sm text-text-secondary mt-1 text-left">
                        {completedTodosCount} / {healthPlan.dailyTodos.length} tâches complétées
                      </p>
                    </div>
                    {completedTodosCount === healthPlan.dailyTodos.length && (
                      <div className="flex items-center gap-2 text-status-optimal">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Journée complète !</span>
                      </div>
                    )}
                  </div>
                  {collapsedSections.dailyTodos ? (
                    <ChevronDown className="w-5 h-5 text-text-muted ml-2" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-text-muted ml-2" />
                  )}
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    if (!printWindow) return
                    
                    const todos = healthPlan.dailyTodos!
                      .sort((a, b) => {
                        const priorityOrder = { high: 0, medium: 1, low: 2 }
                        return priorityOrder[a.priority] - priorityOrder[b.priority]
                      })
                    
                    const categoryIcons = {
                      nutrition: '🍎',
                      fitness: '💪',
                      behavior: '🧠',
                      weight: '🎯',
                      health: '❤️',
                    }
                    const priorityLabels = {
                      high: 'Priorité haute',
                      medium: 'Priorité moyenne',
                      low: 'Priorité basse',
                    }
                    const timeLabels = {
                      morning: '🌅 Matin',
                      afternoon: '☀️ Après-midi',
                      evening: '🌙 Soir',
                      anytime: '⏰ Anytime',
                    }
                    
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>Todo du jour - ${new Date().toLocaleDateString('fr-FR')}</title>
                          <style>
                            @page {
                              size: A4;
                              margin: 1cm;
                            }
                            * {
                              margin: 0;
                              padding: 0;
                              box-sizing: border-box;
                            }
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                              color: #1f2937;
                              line-height: 1.4;
                            }
                            .header {
                              text-align: center;
                              margin-bottom: 0.8rem;
                              padding-bottom: 0.5rem;
                              border-bottom: 2px solid #3b82f6;
                            }
                            .header h1 {
                              font-size: 1.5rem;
                              color: #1e40af;
                              margin-bottom: 0.3rem;
                            }
                            .header .date {
                              font-size: 0.9rem;
                              color: #6b7280;
                            }
                            .todos {
                              display: grid;
                              gap: 0.5rem;
                            }
                            .todo-item {
                              padding: 0.6rem;
                              border: 1.5px solid #e5e7eb;
                              border-radius: 6px;
                              page-break-inside: avoid;
                            }
                            .todo-item.high {
                              border-color: #dc2626;
                              background: #fef2f2;
                            }
                            .todo-item.medium {
                              border-color: #3b82f6;
                              background: #eff6ff;
                            }
                            .todo-item.low {
                              border-color: #9ca3af;
                              background: #f9fafb;
                            }
                            .todo-header {
                              display: flex;
                              align-items: center;
                              gap: 0.4rem;
                              margin-bottom: 0.3rem;
                            }
                            .todo-icon {
                              font-size: 1rem;
                            }
                            .todo-priority {
                              font-size: 0.65rem;
                              padding: 0.2rem 0.4rem;
                              border-radius: 3px;
                              font-weight: 600;
                            }
                            .todo-priority.high {
                              background: #fee2e2;
                              color: #991b1b;
                            }
                            .todo-priority.medium {
                              background: #dbeafe;
                              color: #1e40af;
                            }
                            .todo-priority.low {
                              background: #f3f4f6;
                              color: #4b5563;
                            }
                            .todo-time {
                              font-size: 0.65rem;
                              color: #6b7280;
                              margin-left: auto;
                            }
                            .todo-task {
                              font-size: 0.85rem;
                              margin-top: 0.3rem;
                              padding-left: 1.2rem;
                              line-height: 1.3;
                            }
                            .todo-checkbox {
                              width: 16px;
                              height: 16px;
                              border: 2px solid #9ca3af;
                              border-radius: 3px;
                              display: inline-block;
                              margin-right: 0.4rem;
                              vertical-align: middle;
                            }
                            .footer {
                              margin-top: 0.8rem;
                              padding-top: 0.5rem;
                              border-top: 1px solid #e5e7eb;
                              text-align: center;
                              color: #6b7280;
                              font-size: 0.75rem;
                            }
                            @media print {
                              .no-print {
                                display: none;
                              }
                              body {
                                print-color-adjust: exact;
                                -webkit-print-color-adjust: exact;
                              }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>Todo du jour</h1>
                            <div class="date">${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                          </div>
                          
                          <div class="todos">
                            ${todos.map(todo => `
                              <div class="todo-item ${todo.priority}">
                                <div class="todo-header">
                                  <span class="todo-icon">${categoryIcons[todo.category] || '✓'}</span>
                                  <span class="todo-priority ${todo.priority}">${priorityLabels[todo.priority]}</span>
                                  <span class="todo-time">${timeLabels[todo.timeOfDay || 'anytime']}</span>
                                </div>
                                <div class="todo-task">
                                  <span class="todo-checkbox"></span>
                                  ${todo.task}
                                </div>
                              </div>
                            `).join('')}
                          </div>
                          
                          <div class="footer">
                            Plan de santé personnalisé - Généré le ${new Date(healthPlan.generatedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </body>
                      </html>
                    `)
                    printWindow.document.close()
                    setTimeout(() => {
                      printWindow.print()
                    }, 250)
                  }}
                  className="ml-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors text-sm font-medium"
                  title="Imprimer la todo list"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimer</span>
                </button>
              </div>
              {!collapsedSections.dailyTodos && (

              <div className="space-y-3">
                {healthPlan.dailyTodos
                  .sort((a, b) => {
                    const priorityOrder = { high: 0, medium: 1, low: 2 }
                    return priorityOrder[a.priority] - priorityOrder[b.priority]
                  })
                  .map((todo) => {
                    const isCompleted = todo.completed || false
                    const categoryIcons = {
                      nutrition: Apple,
                      fitness: Dumbbell,
                      behavior: Brain,
                      weight: Target,
                      health: HeartPulse,
                    }
                    const categoryColors = {
                      nutrition: 'text-green-500',
                      fitness: 'text-blue-500',
                      behavior: 'text-purple-500',
                      weight: 'text-orange-500',
                      health: 'text-red-500',
                    }
                    const priorityColors = {
                      high: 'border-status-attention bg-status-attention/5',
                      medium: 'border-accent-primary bg-accent-primary/5',
                      low: 'border-border bg-surface-alt',
                    }
                    const timeLabels = {
                      morning: '🌅 Matin',
                      afternoon: '☀️ Après-midi',
                      evening: '🌙 Soir',
                      anytime: '⏰ Anytime',
                    }
                    const Icon = categoryIcons[todo.category] || CheckCircle2

                    return (
                      <div
                        key={todo.id}
                        className={`border rounded-xl p-4 transition-all ${
                          isCompleted
                            ? 'opacity-60 bg-surface-alt border-border'
                            : priorityColors[todo.priority]
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => {
                              toggleDailyTodoCompleted(todo.id)
                            }}
                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-status-optimal border-status-optimal'
                                : 'border-text-muted hover:border-accent-primary'
                            }`}
                          >
                            {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Icon className={`w-4 h-4 ${categoryColors[todo.category]}`} />
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                                todo.priority === 'high' 
                                  ? 'bg-status-attention/20 text-status-attention'
                                  : todo.priority === 'medium'
                                  ? 'bg-accent-primary/20 text-accent-primary'
                                  : 'bg-text-muted/20 text-text-muted'
                              }`}>
                                {todo.priority === 'high' ? 'Priorité haute' : todo.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                              </span>
                              <span className="text-xs text-text-muted">
                                {timeLabels[todo.timeOfDay || 'anytime']}
                              </span>
                            </div>
                            <p className={`text-sm ${isCompleted ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                              {todo.task}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
              )}
            </section>
          )}

          {/* Weight Management */}
          {healthPlan.weightManagement && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <button
                onClick={() => toggleSection('weightManagement')}
                className="w-full flex items-center justify-between gap-3 mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                    <Target className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">Gestion du poids</h2>
                </div>
                {collapsedSections.weightManagement ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {!collapsedSections.weightManagement && (
              <div className="space-y-6">
                {/* Current vs Recommended Weight */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="text-sm text-text-muted mb-1">Poids actuel</div>
                    <div className="text-2xl font-bold text-text-primary">{healthPlan.weightManagement.currentWeight} kg</div>
                  </div>
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="text-sm text-text-muted mb-1">Poids recommandé</div>
                    <div className="text-2xl font-bold text-accent-primary">{healthPlan.weightManagement.recommendedWeight} kg</div>
                    <div className="text-xs text-text-secondary mt-1">
                      {healthPlan.weightManagement.currentWeight > healthPlan.weightManagement.recommendedWeight 
                        ? `À perdre: ${(healthPlan.weightManagement.currentWeight - healthPlan.weightManagement.recommendedWeight).toFixed(1)} kg`
                        : `À prendre: ${(healthPlan.weightManagement.recommendedWeight - healthPlan.weightManagement.currentWeight).toFixed(1)} kg`
                      }
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                {healthPlan.weightManagement.reasoning && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-5 h-5 text-accent-primary" />
                      <span className="font-semibold text-text-primary">Pourquoi ce poids ?</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">{healthPlan.weightManagement.reasoning}</p>
                  </div>
                )}

                {/* Weight Progression Chart */}
                {healthPlan.weightManagement.weightProgression && healthPlan.weightManagement.weightProgression.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-accent-primary" />
                      <span className="font-semibold text-text-primary">Courbe de progression</span>
                    </div>
                    <WeightProgressionChart 
                      progression={healthPlan.weightManagement.weightProgression}
                      currentWeight={healthPlan.weightManagement.currentWeight}
                      targetWeight={healthPlan.weightManagement.recommendedWeight}
                    />
                  </div>
                )}

                {/* Personalized Diet */}
                {healthPlan.weightManagement.personalizedDiet && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <UtensilsCrossed className="w-5 h-5 text-accent-primary" />
                      <span className="font-semibold text-text-primary">Régime ultra personnalisé</span>
                    </div>

                    {/* Calories & Macronutrients */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-surface-alt border border-border rounded-xl p-4">
                        <div className="text-sm text-text-muted mb-2">Calories quotidiennes</div>
                        <div className="text-2xl font-bold text-text-primary">
                          {healthPlan.weightManagement.personalizedDiet.dailyCalories} kcal
                        </div>
                      </div>
                      {healthPlan.weightManagement.personalizedDiet.macronutrients && (
                        <div className="bg-surface-alt border border-border rounded-xl p-4">
                          <div className="text-sm text-text-muted mb-3">Macronutriments</div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-text-secondary">Protéines</span>
                              <span className="text-sm font-semibold text-text-primary">
                                {healthPlan.weightManagement.personalizedDiet.macronutrients.proteins.grams}g ({healthPlan.weightManagement.personalizedDiet.macronutrients.proteins.percentage}%)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-text-secondary">Glucides</span>
                              <span className="text-sm font-semibold text-text-primary">
                                {healthPlan.weightManagement.personalizedDiet.macronutrients.carbs.grams}g ({healthPlan.weightManagement.personalizedDiet.macronutrients.carbs.percentage}%)
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-text-secondary">Lipides</span>
                              <span className="text-sm font-semibold text-text-primary">
                                {healthPlan.weightManagement.personalizedDiet.macronutrients.fats.grams}g ({healthPlan.weightManagement.personalizedDiet.macronutrients.fats.percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Meal Plan */}
                    {healthPlan.weightManagement.personalizedDiet.mealPlan?.length > 0 && (
                      <div className="bg-surface-alt border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-5 h-5 text-accent-primary" />
                          <span className="font-semibold text-text-primary">Plan de repas</span>
                        </div>
                        <ul className="space-y-2">
                          {healthPlan.weightManagement.personalizedDiet.mealPlan.map((meal, i) => (
                            <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                              <span className="text-accent-primary mt-1">•</span>
                              <span>{meal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Principles */}
                    {healthPlan.weightManagement.personalizedDiet.keyPrinciples?.length > 0 && (
                      <div className="bg-surface-alt border border-border rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Leaf className="w-5 h-5 text-accent-primary" />
                          <span className="font-semibold text-text-primary">Principes clés</span>
                        </div>
                        <ul className="space-y-2">
                          {healthPlan.weightManagement.personalizedDiet.keyPrinciples.map((principle, i) => (
                            <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-status-optimal mt-0.5 flex-shrink-0" />
                              <span>{principle}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </section>
          )}

          {/* Nutrition */}
          {healthPlan.nutrition && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                  <Apple className="w-6 h-6 text-accent-primary" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary">Nutrition</h2>
              </div>
              
              <div className="space-y-6">
                {/* Focus & Avoid */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {healthPlan.nutrition.focus?.length > 0 && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-status-optimal" />
                        <h3 className="text-base font-semibold text-text-primary">À privilégier</h3>
                      </div>
                      <ul className="space-y-2">
                        {healthPlan.nutrition.focus.map((item, i) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-status-optimal mt-1">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {healthPlan.nutrition.avoid?.length > 0 && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-5 h-5 text-status-attention" />
                        <h3 className="text-base font-semibold text-text-primary">À limiter</h3>
                      </div>
                      <ul className="space-y-2">
                        {healthPlan.nutrition.avoid.map((item, i) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-status-attention mt-1">✗</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Guidelines */}
                {healthPlan.nutrition.mealsGuidelines?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UtensilsCrossed className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Conseils repas</h3>
                    </div>
                    <ul className="space-y-3">
                      {healthPlan.nutrition.mealsGuidelines.map((g, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-3 pl-2">
                          <span className="text-text-muted mt-0.5">•</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hydration & Supplements */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {healthPlan.nutrition.hydration && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="w-5 h-5 text-accent-primary" />
                        <span className="font-semibold text-text-primary">Hydratation</span>
                      </div>
                      <p className="text-sm text-text-secondary">{healthPlan.nutrition.hydration}</p>
                    </div>
                  )}
                  {healthPlan.nutrition.supplements?.length > 0 && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Pill className="w-5 h-5 text-accent-primary" />
                        <span className="font-semibold text-text-primary">Suppléments</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {healthPlan.nutrition.supplements.map((supp, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-surface border border-border text-text-secondary rounded-full">
                            {supp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Fitness */}
          {healthPlan.fitness && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <button
                onClick={() => toggleSection('fitness')}
                className="w-full flex items-center justify-between gap-3 mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">Activité physique</h2>
                </div>
                {collapsedSections.fitness ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                )}
              </button>
              
              {!collapsedSections.fitness && (
              <div className="space-y-6">
                {healthPlan.fitness.weeklyGoal && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-accent-primary" />
                      <span className="font-semibold text-text-primary">Objectif hebdomadaire</span>
                    </div>
                    <p className="text-sm text-text-secondary">{healthPlan.fitness.weeklyGoal}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {healthPlan.fitness.cardio && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-accent-primary" />
                        <h3 className="text-sm font-semibold text-text-primary">Cardio</h3>
                      </div>
                      <p className="text-sm text-text-secondary">{healthPlan.fitness.cardio}</p>
                    </div>
                  )}
                  {healthPlan.fitness.strength && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="w-5 h-5 text-accent-primary" />
                        <h3 className="text-sm font-semibold text-text-primary">Renforcement</h3>
                      </div>
                      <p className="text-sm text-text-secondary">{healthPlan.fitness.strength}</p>
                    </div>
                  )}
                  {healthPlan.fitness.mobility && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-accent-primary" />
                        <h3 className="text-sm font-semibold text-text-primary">Mobilité & étirements</h3>
                      </div>
                      <p className="text-sm text-text-secondary">{healthPlan.fitness.mobility}</p>
                    </div>
                  )}
                  {healthPlan.fitness.rest && (
                    <div className="bg-surface-alt border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Moon className="w-5 h-5 text-accent-primary" />
                        <h3 className="text-sm font-semibold text-text-primary">Repos</h3>
                      </div>
                      <p className="text-sm text-text-secondary">{healthPlan.fitness.rest}</p>
                    </div>
                  )}
                </div>

                {/* Programme suggéré (liste) */}
                {healthPlan.fitness.plan?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Détails du programme</h3>
                    </div>
                    <ul className="space-y-2">
                      {healthPlan.fitness.plan.map((p, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-text-muted font-medium mt-0.5">{i + 1}.</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              )}
            </section>
          )}

          {/* Behavior */}
          {healthPlan.behavior && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <button
                onClick={() => toggleSection('behavior')}
                className="w-full flex items-center justify-between gap-3 mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">Bien-être & habitudes</h2>
                </div>
                {collapsedSections.behavior ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-text-muted" />
                )}
              </button>
              
              {!collapsedSections.behavior && (
              <div className="grid sm:grid-cols-2 gap-4">
                {healthPlan.behavior.sleep?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Moon className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Sommeil</h3>
                    </div>
                    <ul className="space-y-2">
                      {healthPlan.behavior.sleep.map((item, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-text-muted mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {healthPlan.behavior.stress?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wind className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Gestion du stress</h3>
                    </div>
                    <ul className="space-y-2">
                      {healthPlan.behavior.stress.map((item, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-text-muted mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {healthPlan.behavior.recovery?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Leaf className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Récupération</h3>
                    </div>
                    <ul className="space-y-2">
                      {healthPlan.behavior.recovery.map((item, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-text-muted mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {healthPlan.behavior.mindfulness?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Mindfulness</h3>
                    </div>
                    <ul className="space-y-2">
                      {healthPlan.behavior.mindfulness.map((item, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-text-muted mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {healthPlan.behavior.other?.length > 0 && (
                  <div className="bg-surface-alt border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-5 h-5 text-accent-primary" />
                      <h3 className="text-base font-semibold text-text-primary">Autres conseils</h3>
                    </div>
                    <ul className="space-y-2">
                      {healthPlan.behavior.other.map((item, i) => (
                        <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                          <span className="text-text-muted mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              )}
            </section>
          )}

          {/* Synergies */}
          {healthPlan.synergies?.length > 0 && (
            <section className="bg-accent-secondary/30 border border-accent-primary/20 rounded-xl p-6">
              <button
                onClick={() => toggleSection('insights')}
                className="w-full flex items-center gap-3 mb-4"
              >
                <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-accent-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-semibold text-text-primary">Synergies Sang + ADN</h2>
                  <p className="text-sm text-text-muted mt-1">
                    Recommandations ciblant vos biomarqueurs sanguins ET vos prédispositions génétiques
                  </p>
                </div>
                {collapsedSections.insights ? (
                  <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-text-muted flex-shrink-0" />
                )}
              </button>
              {!collapsedSections.insights && (
              <ul className="space-y-3">
                {healthPlan.synergies.map((s, i) => (
                  <li key={i} className="text-sm text-text-secondary flex items-start gap-3 bg-surface rounded-lg p-3 border border-border">
                    <span className="text-accent-primary mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              )}
            </section>
          )}

          {/* Insights */}
          {(healthPlan.bloodInsights?.length > 0 || healthPlan.dnaInsights?.length > 0) && (
            <div className="grid sm:grid-cols-2 gap-6">
              {healthPlan.bloodInsights?.length > 0 && (
                <section className="bg-surface border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Droplet className="w-6 h-6 text-accent-primary" />
                    <h2 className="text-lg font-semibold text-text-primary">Basé sur vos biomarqueurs</h2>
                  </div>
                  <ul className="space-y-3">
                    {healthPlan.bloodInsights.map((ins, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-3 bg-surface-alt rounded-lg p-3 border border-border">
                        <span className="text-text-muted mt-0.5">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {healthPlan.dnaInsights?.length > 0 && (
                <section className="bg-surface border border-border rounded-xl p-6">
                  <button
                    onClick={() => toggleSection('insights')}
                    className="w-full flex items-center justify-between gap-2 mb-4"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-accent-primary" />
                      <h2 className="text-lg font-semibold text-text-primary">Basé sur votre ADN</h2>
                    </div>
                    {collapsedSections.insights ? (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    )}
                  </button>
                  {!collapsedSections.insights && (
                  <ul className="space-y-3">
                    {healthPlan.dnaInsights.map((ins, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-3 bg-surface-alt rounded-lg p-3 border border-border">
                        <span className="text-text-muted mt-0.5">•</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                  )}
                </section>
              )}
            </div>
          )}

          {/* Spotify Playlists */}
          {recommendedPlaylists.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent-secondary flex items-center justify-center">
                  <Music className="w-6 h-6 text-accent-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-text-primary">Playlists recommandées</h2>
                  <p className="text-sm text-text-muted">Basées sur vos objectifs bien-être</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {recommendedPlaylists.map((playlist: any) => (
                  <a
                    key={playlist.id}
                    href={`https://open.spotify.com/playlist/${playlist.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-border bg-surface-alt hover:border-accent-primary/50 hover:shadow-lg transition-all"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Icône/Image */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-primary/20 to-accent-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <span className="text-3xl">{playlist.icon || '🎵'}</span>
                        </div>
                        
                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-text-primary text-base group-hover:text-accent-primary transition-colors mb-1">
                                {playlist.name}
                              </h3>
                              <p className="text-sm text-text-muted leading-relaxed">
                                {playlist.description}
                              </p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-text-muted group-hover:text-accent-primary flex-shrink-0 transition-colors mt-1" />
                          </div>
                          
                          {/* Badge Spotify */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">▶</span>
                              </div>
                              <span className="text-xs font-medium text-text-secondary">Spotify</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Effet hover */}
                    <div className="absolute inset-0 bg-accent-primary/0 group-hover:bg-accent-primary/5 transition-colors pointer-events-none" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
