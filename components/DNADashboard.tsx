'use client'

import { useState } from 'react'
import { useAppStore, DNACategory, SNPResult, getDNACategoryColor, getDNACategoryLabel, getSNPImpactColor, getSNPImpactLabel, getRiskLevelLabel } from '@/lib/store'
import { 
  Dna, Heart, Flame, Apple, Pill, Moon, Shield, Clock, Sparkles, User,
  ChevronRight, FileText, AlertTriangle, CheckCircle, Info, TrendingUp,
  Activity, Brain, Zap, X
} from 'lucide-react'

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

const categoryIcons: Record<string, any> = {
  cardiovascular: Heart,
  metabolism: Flame,
  nutrition: Apple,
  vitamins: Pill,
  fitness: Activity,
  pharmacogenomics: Pill,
  sleep: Moon,
  immune: Shield,
  longevity: Clock,
  traits: User,
}

const categoryNames: Record<string, string> = {
  cardiovascular: 'Cardiovasculaire',
  metabolism: 'Métabolisme',
  nutrition: 'Nutrition',
  vitamins: 'Vitamines',
  fitness: 'Fitness',
  pharmacogenomics: 'Pharmacogénomique',
  sleep: 'Sommeil',
  immune: 'Immunité',
  longevity: 'Longévité',
  traits: 'Traits physiques',
}

export default function DNADashboard() {
  const { dnaAnalyses } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAllSNPs, setShowAllSNPs] = useState(false)
  const [modalCategory, setModalCategory] = useState<DNACategory | null>(null)
  
  const latestAnalysis = dnaAnalyses[0]
  
  if (!latestAnalysis) {
    return (
      <div className="text-center py-12">
        <Dna className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          Aucune analyse ADN
        </h3>
        <p className="text-text-muted">
          Uploadez votre fichier ADN pour voir vos résultats ici.
        </p>
      </div>
    )
  }

  const filteredCategories = selectedCategory
    ? latestAnalysis.categories.filter(c => c.id === selectedCategory)
    : latestAnalysis.categories

  // Count SNPs by impact
  const allSNPs = latestAnalysis.categories.flatMap(c => c.snps)
  const positiveSNPs = allSNPs.filter(s => s.impact === 'positive').length
  const neutralSNPs = allSNPs.filter(s => s.impact === 'neutral').length
  const riskSNPs = allSNPs.filter(s => s.impact === 'risk').length

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <div className="bg-gradient-to-br from-accent-primary to-accent-primary-dark rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Dna className="w-6 h-6" />
              <span className="text-white/80 text-sm">Analyse ADN</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Score génétique global</h2>
            <p className="text-white/70 text-sm">
              Basé sur {latestAnalysis.analyzedSnps} SNPs analysés sur {latestAnalysis.totalSnps.toLocaleString()} variants
            </p>
            <p className="text-white/60 text-xs mt-1">
              Source: {latestAnalysis.source.toUpperCase()} • {new Date(latestAnalysis.date).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="bg-white/20 rounded-2xl p-3">
            <ScoreRing score={latestAnalysis.overallScore} size={100} />
          </div>
        </div>
      </div>

      {/* SNP Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-700">{positiveSNPs}</p>
          <p className="text-sm text-green-600">Favorables</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <Info className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-700">{neutralSNPs}</p>
          <p className="text-sm text-gray-600">Neutres</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-700">{riskSNPs}</p>
          <p className="text-sm text-red-600">À surveiller</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-accent-primary text-white'
              : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/80'
          }`}
        >
          Tout voir
        </button>
        {latestAnalysis.categories.map((cat) => {
          const Icon = categoryIcons[cat.id] || Dna
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {categoryNames[cat.id] || cat.name}
            </button>
          )
        })}
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => {
          const Icon = categoryIcons[category.id] || Dna
          const statusColor = getDNACategoryColor(category.status)
          const statusLabel = getDNACategoryLabel(category.status)
          
          return (
            <div 
              key={category.id} 
              className="bg-surface border border-border rounded-xl p-5 cursor-pointer hover:border-accent-primary/50 transition-all hover:shadow-md"
              onClick={() => setModalCategory(category)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">
                      {categoryNames[category.id] || category.name}
                    </h4>
                    <span 
                      className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium"
                      style={{ 
                        backgroundColor: `${statusColor}15`,
                        color: statusColor
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <ScoreRing score={category.score} size={56} showLabel={false} />
              </div>
              
              <p className="text-sm text-text-muted mb-3">
                {category.snps.length} variant{category.snps.length > 1 ? 's' : ''} analysé{category.snps.length > 1 ? 's' : ''}
              </p>
              
              <p className="text-sm text-text-secondary line-clamp-2">
                {category.summary}
              </p>
            </div>
          )
        })}
      </div>

      {/* SNPs Details */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary flex items-center gap-2">
            <Dna className="w-5 h-5 text-accent-primary" />
            Détails des variants génétiques
          </h3>
          <button
            onClick={() => setShowAllSNPs(!showAllSNPs)}
            className="text-sm text-accent-primary hover:underline"
          >
            {showAllSNPs ? 'Voir moins' : 'Voir tout'}
          </button>
        </div>
        
        <div className="space-y-3">
          {(showAllSNPs ? allSNPs : allSNPs.slice(0, 6)).map((snp, index) => {
            const impactColor = getSNPImpactColor(snp.impact)
            const impactLabel = getSNPImpactLabel(snp.impact)
            
            return (
              <div key={`${snp.rsid}-${index}`} className="bg-surface-alt rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-text-primary">
                        {snp.rsid}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({snp.gene})
                      </span>
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          backgroundColor: `${impactColor}15`,
                          color: impactColor
                        }}
                      >
                        {impactLabel}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{snp.trait}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-text-primary">
                      {snp.genotype}
                    </span>
                    <p className="text-xs text-text-muted">
                      Chr {snp.chromosome}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-text-muted">{snp.description}</p>
                
                {snp.recommendation && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-sm text-accent-primary flex items-start gap-2">
                      <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {snp.recommendation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Résumé de votre profil génétique</h3>
            <p className="text-xs text-text-muted">Analyse personnalisée basée sur votre ADN</p>
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

      {/* Insights */}
      {latestAnalysis.insights.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4">Points clés de votre ADN</h3>
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
      {latestAnalysis.recommendations.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="font-semibold text-text-primary mb-4">
            Recommandations basées sur votre ADN
          </h3>
          <div className="space-y-3">
            {latestAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-accent-secondary/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-white flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-text-secondary text-sm">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-800 font-medium">Information importante</p>
          <p className="text-amber-700 text-sm mt-1">
            Cette analyse génétique est fournie à titre informatif uniquement. Elle ne constitue pas un diagnostic médical 
            et ne remplace pas l'avis d'un professionnel de santé. Les gènes ne déterminent pas tout : l'environnement, 
            le mode de vie et d'autres facteurs jouent un rôle crucial dans votre santé.
          </p>
        </div>
      </div>

      {/* Category Detail Modal */}
      {modalCategory && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setModalCategory(null)}
        >
          <div
            className="bg-surface rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                {(() => {
                  const Icon = categoryIcons[modalCategory.id] || Dna
                  const statusColor = getDNACategoryColor(modalCategory.status)
                  const statusLabel = getDNACategoryLabel(modalCategory.status)
                  return (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-accent-secondary flex items-center justify-center text-accent-primary">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-text-primary">
                          {categoryNames[modalCategory.id] || modalCategory.name}
                        </h2>
                        <span 
                          className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${statusColor}15`,
                            color: statusColor
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    </>
                  )
                })()}
              </div>
              <button
                onClick={() => setModalCategory(null)}
                className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Score */}
              <div className="flex items-center justify-center py-4">
                <ScoreRing score={modalCategory.score} size={120} />
              </div>

              {/* Summary */}
              <div>
                <h3 className="font-semibold text-text-primary mb-3">Résumé</h3>
                <p className="text-text-secondary leading-relaxed">
                  {modalCategory.summary}
                </p>
              </div>

              {/* SNPs Count */}
              <div className="bg-surface-alt rounded-lg p-4">
                <p className="text-sm text-text-muted">
                  <span className="font-semibold text-text-primary">{modalCategory.snps.length}</span> variant{modalCategory.snps.length > 1 ? 's' : ''} analysé{modalCategory.snps.length > 1 ? 's' : ''} dans cette catégorie
                </p>
              </div>

              {/* SNPs List */}
              {modalCategory.snps.length > 0 && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-4">Variants génétiques</h3>
                  <div className="space-y-3">
                    {modalCategory.snps.map((snp, index) => {
                      const impactColor = getSNPImpactColor(snp.impact)
                      const impactLabel = getSNPImpactLabel(snp.impact)
                      
                      return (
                        <div key={`${snp.rsid}-${index}`} className="bg-surface-alt rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-semibold text-text-primary">
                                  {snp.rsid}
                                </span>
                                {snp.gene && (
                                  <span className="text-xs text-text-muted">
                                    ({snp.gene})
                                  </span>
                                )}
                                <span 
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ 
                                    backgroundColor: `${impactColor}15`,
                                    color: impactColor
                                  }}
                                >
                                  {impactLabel}
                                </span>
                                {snp.riskLevel && (
                                  <span className="text-xs text-text-muted">
                                    Risque: {getRiskLevelLabel(snp.riskLevel)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-text-primary mt-1">{snp.trait}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-lg font-bold text-text-primary">
                                {snp.genotype}
                              </span>
                              <p className="text-xs text-text-muted">
                                Chr {snp.chromosome}:{snp.position}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-text-secondary mt-2">{snp.description}</p>
                          
                          {snp.recommendation && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-sm text-accent-primary flex items-start gap-2">
                                <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="font-medium">Recommandation:</span> {snp.recommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
