'use client'

import { useRef, useState, useEffect } from 'react'
import { useAppStore, getDNACategoryLabel, getSNPImpactLabel, GeneratedReport } from '@/lib/store'
import { X, Printer, Loader2, Sparkles, RefreshCw } from 'lucide-react'

interface PrintReportProps {
  onClose: () => void
}

interface ReportSynthesis {
  bloodSynthesis: string
  dnaSynthesis: string
  globalSynthesis: string
  keyPoints: string[]
}

// Couleurs du thème
const COLORS = {
  primary: '#1e5631',
  primaryLight: '#2d7a45',
  accent: '#e8f5e9',
  success: '#2d7a45',
  warning: '#d97706',
  danger: '#dc2626',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
}

// Footer component
function PageFooter({ pageNum, total }: { pageNum: number; total: number }) {
  return (
    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: `1px solid ${COLORS.accent}`, fontSize: '9px', color: '#9ca3af' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Rapport généré par <span className="logo-vitea" style={{ color: COLORS.primary }}>Vitea</span> • Ce document ne remplace pas un avis médical</span>
        <span>Page {pageNum}/{total}</span>
      </div>
    </div>
  )
}

export default function PrintReport({ onClose }: PrintReportProps) {
  const { analyses, dnaAnalyses, profile, report, setReport } = useAppStore()
  const reportRef = useRef<HTMLDivElement>(null)
  
  const latestBlood = analyses[analyses.length - 1]
  const latestDNA = dnaAnalyses[dnaAnalyses.length - 1]
  
  const patientName = profile 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Patient'
    : 'Patient'
  
  // Calculate total pages
  const totalPages = 1 + (latestBlood ? 1 : 0) + (latestDNA ? 1 : 0) + 1

  // State for report generation
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0)

  // State for AI synthesis
  const [synthesis, setSynthesis] = useState<ReportSynthesis | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [synthesisError, setSynthesisError] = useState<string | null>(null)

  const loadingMessages = [
    "Analyse des résultats sanguins...",
    "Analyse des prédispositions génétiques...",
    "Croisement des données...",
    "Rédaction du rapport médical...",
    "Finalisation du document...",
  ]

  // Generate report on mount if not exists
  useEffect(() => {
    if (!report && profile?.openaiKey && (latestBlood || latestDNA)) {
      generateReport()
    }
  }, [])

  // Loading message rotation
  useEffect(() => {
    if (!isGeneratingReport) return
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isGeneratingReport])

  const generateReport = async () => {
    if (!profile?.openaiKey || (!latestBlood && !latestDNA)) return
    
    setIsGeneratingReport(true)
    setReportError(null)
    
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodAnalysis: latestBlood,
          dnaAnalysis: latestDNA,
          profile,
          apiKey: profile.openaiKey,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du rapport')
      }
      
      const data = await response.json()
      const generatedReport: GeneratedReport = {
        ...data,
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
      }
      setReport(generatedReport)
    } catch (error: any) {
      setReportError(error.message)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Generate synthesis on mount if report exists
  useEffect(() => {
    if (report && profile?.openaiKey && (latestBlood || latestDNA) && !synthesis) {
      generateSynthesis()
    }
  }, [report])

  const generateSynthesis = async () => {
    if (!profile?.openaiKey) return
    
    setIsGenerating(true)
    setSynthesisError(null)
    
    try {
      const response = await fetch('/api/synthesize-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodAnalysis: latestBlood,
          dnaAnalysis: latestDNA,
          profile,
          apiKey: profile.openaiKey,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la synthèse')
      }
      
      const data = await response.json()
      setSynthesis(data)
    } catch (error: any) {
      setSynthesisError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handlePrint = () => {
    const printContent = reportRef.current
    if (!printContent) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    
    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        font-size: 12px; 
        line-height: 1.4; 
        color: #1a1a1a; 
        background: white; 
      }
      
      .logo-vitea { font-family: 'Playfair Display', Georgia, serif !important; }
      
      /* Page layout */
      .page { 
        padding: 30px 35px; 
        min-height: 277mm; 
        page-break-after: always; 
        background: white; 
        display: flex;
        flex-direction: column;
      }
      .page:last-child { page-break-after: avoid; }
      
      /* Flexbox */
      .flex { display: flex !important; }
      .flex-col { flex-direction: column !important; }
      .flex-1 { flex: 1 1 0% !important; }
      .items-center { align-items: center !important; }
      .items-start { align-items: flex-start !important; }
      .justify-between { justify-content: space-between !important; }
      .justify-center { justify-content: center !important; }
      .gap-2 { gap: 6px !important; }
      .gap-4 { gap: 12px !important; }
      .space-y-1 > * + * { margin-top: 4px !important; }
      
      /* Grid */
      .grid { display: grid !important; }
      .grid-cols-2 { grid-template-columns: repeat(2, 1fr) !important; }
      .grid-cols-4 { grid-template-columns: repeat(4, 1fr) !important; }
      
      /* Spacing */
      .mt-auto { margin-top: auto !important; }
      .mt-1 { margin-top: 4px !important; }
      .mb-1 { margin-bottom: 4px !important; }
      .mb-2 { margin-bottom: 6px !important; }
      .mb-3 { margin-bottom: 10px !important; }
      .mb-4 { margin-bottom: 14px !important; }
      .mb-5 { margin-bottom: 18px !important; }
      .mb-6 { margin-bottom: 20px !important; }
      .p-3 { padding: 10px !important; }
      .p-4 { padding: 14px !important; }
      .p-10 { padding: 30px 35px !important; }
      .px-2 { padding-left: 6px !important; padding-right: 6px !important; }
      .py-1 { padding-top: 3px !important; padding-bottom: 3px !important; }
      .pb-1 { padding-bottom: 4px !important; }
      .pb-2 { padding-bottom: 6px !important; }
      .pb-5 { padding-bottom: 16px !important; }
      .pt-6 { padding-top: 16px !important; }
      
      /* Typography */
      .text-xs { font-size: 10px !important; line-height: 1.3 !important; }
      .text-sm { font-size: 11px !important; line-height: 1.4 !important; }
      .text-base { font-size: 12px !important; }
      .text-lg { font-size: 15px !important; }
      .text-xl { font-size: 17px !important; }
      .text-2xl { font-size: 20px !important; }
      .font-medium { font-weight: 500 !important; }
      .font-semibold { font-weight: 600 !important; }
      .font-bold { font-weight: 700 !important; }
      .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important; font-size: 10px !important; }
      .uppercase { text-transform: uppercase !important; }
      .tracking-tight { letter-spacing: -0.02em !important; }
      .leading-relaxed { line-height: 1.5 !important; }
      .text-right { text-align: right !important; }
      .text-left { text-align: left !important; }
      
      /* Colors */
      .text-white { color: white !important; }
      .text-gray-400 { color: #9ca3af !important; }
      .text-gray-500 { color: #6b7280 !important; }
      .text-gray-600 { color: #4b5563 !important; }
      .text-gray-700 { color: #374151 !important; }
      .text-gray-800 { color: #1f2937 !important; }
      .text-gray-900 { color: #111827 !important; }
      
      /* Borders & Backgrounds */
      .border { border: 1px solid #e5e7eb !important; }
      .border-b { border-bottom: 1px solid #e5e7eb !important; }
      .border-gray-100 { border-color: #f3f4f6 !important; }
      .border-gray-200 { border-color: #e5e7eb !important; }
      .rounded { border-radius: 4px !important; }
      .rounded-lg { border-radius: 6px !important; }
      .rounded-full { border-radius: 9999px !important; }
      
      /* Width & Height */
      .w-5 { width: 16px !important; min-width: 16px !important; height: 16px !important; }
      .h-5 { height: 16px !important; }
      .w-16 { width: 50px !important; }
      .h-16 { height: 50px !important; }
      .w-full { width: 100% !important; }
      .flex-shrink-0 { flex-shrink: 0 !important; }
      
      /* Positioning */
      .relative { position: relative !important; }
      .absolute { position: absolute !important; }
      .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
      
      /* SVG - Score rings */
      svg { display: block !important; overflow: visible !important; }
      svg.w-16 { width: 50px !important; height: 50px !important; }
      svg.transform { transform: rotate(-90deg) !important; }
      svg.-rotate-90 { transform: rotate(-90deg) !important; }
      
      /* Tables */
      table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
      th { text-align: left !important; font-weight: 500 !important; font-size: 9px !important; color: #6b7280 !important; padding: 2px 4px 4px 0 !important; }
      td { padding: 3px 4px 3px 0 !important; border-bottom: 1px solid #f3f4f6 !important; vertical-align: top !important; }
      
      /* Lists */
      ul { list-style: none !important; margin: 0 !important; padding: 0 !important; }
      li { display: flex !important; align-items: flex-start !important; }
      
      /* Print specific */
      @page { 
        size: A4; 
        margin: 8mm; 
      }
      
      @media print {
        * { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
          color-adjust: exact !important; 
        }
        body { 
          -webkit-print-color-adjust: exact !important;
          background: white !important;
        }
        .page { 
          page-break-inside: avoid !important;
          box-shadow: none !important;
        }
      }
    `
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport Vitea - ${patientName}</title>
          <style>${styles}</style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    
    // Attendre que les styles et polices se chargent
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 500)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': 
      case 'optimal': return COLORS.success
      case 'attention': 
      case 'standard': return COLORS.warning
      case 'critical': return COLORS.danger
      default: return COLORS.gray
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': 
      case 'optimal': return 'Normal'
      case 'attention': 
      case 'standard': return 'À surveiller'
      case 'critical': return 'Critique'
      default: return 'N/A'
    }
  }

  const groupedBiomarkers = latestBlood?.biomarkers.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = []
    acc[b.category].push(b)
    return acc
  }, {} as Record<string, typeof latestBlood.biomarkers>) || {}

  const bloodStats = latestBlood ? {
    total: latestBlood.biomarkers.length,
    normal: latestBlood.biomarkers.filter(b => b.status === 'optimal' || b.status === 'normal').length,
    attention: latestBlood.biomarkers.filter(b => b.status === 'attention' || b.status === 'standard').length,
    critical: latestBlood.biomarkers.filter(b => b.status === 'critical').length,
  } : null

  const dnaStats = latestDNA ? {
    total: latestDNA.categories.reduce((sum, c) => sum + c.snps.length, 0),
    favorable: latestDNA.categories.reduce((sum, c) => sum + c.snps.filter(s => s.impact === 'favorable').length, 0),
    neutral: latestDNA.categories.reduce((sum, c) => sum + c.snps.filter(s => s.impact === 'neutral').length, 0),
    risk: latestDNA.categories.reduce((sum, c) => sum + c.snps.filter(s => s.impact === 'risk').length, 0),
  } : null

  const toThirdPerson = (text: string): string => {
    return text
      .replace(/\bvotre\b/gi, (match) => match[0] === 'V' ? 'Son' : 'son')
      .replace(/\bvos\b/gi, (match) => match[0] === 'V' ? 'Ses' : 'ses')
      .replace(/\bvous\b/gi, (match) => match[0] === 'V' ? 'Le patient' : 'le patient')
      .replace(/\bavez\b/gi, 'a')
      .replace(/\bêtes\b/gi, 'est')
      .replace(/\bdevez\b/gi, 'doit')
      .replace(/\bpouvez\b/gi, 'peut')
      .replace(/\bdevriez\b/gi, 'devrait')
      .replace(/\bpourriez\b/gi, 'pourrait')
  }

  let currentPage = 0

  // Show loading modal if generating report
  if (isGeneratingReport) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            Génération du rapport
          </h2>
          <p className="text-text-secondary mb-6">
            {loadingMessages[loadingMessageIndex]}
          </p>
          {reportError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {reportError}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show error if report generation failed
  if (reportError && !report) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="mb-4 text-red-600">
            <X className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-3">
            Erreur de génération
          </h2>
          <p className="text-text-secondary mb-6">
            {reportError}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateReport}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-alt transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="print-container fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-black/50 z-50 flex items-start justify-center overflow-auto">
      {/* Control bar */}
      <div className="fixed top-0 left-0 right-0 bg-surface border-b border-border p-4 flex items-center justify-between z-50 print:hidden">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-text-primary">Aperçu du rapport</h2>
          {report && (
            <span className="text-xs text-text-muted">
              Généré le {new Date(report.generatedAt).toLocaleDateString('fr-FR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
          {isGenerating && (
            <span className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Synthèse IA en cours...
            </span>
          )}
          {synthesis && !isGenerating && (
            <span className="flex items-center gap-1 text-sm text-accent-primary">
              <Sparkles className="w-4 h-4" />
              Synthèse IA
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {report && (
            <button
              onClick={generateReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Mettre à jour
            </button>
          )}
          {profile?.openaiKey && !isGenerating && (
            <button
              onClick={generateSynthesis}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-surface-alt transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {synthesis ? 'Régénérer' : 'Générer synthèse'}
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={isGenerating || isGeneratingReport}
            className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Imprimer / PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Report content */}
      <div 
        id="print-report"
        ref={reportRef}
        className="bg-white text-black mt-20 mb-10 shadow-2xl"
        style={{ width: '210mm' }}
      >
        {/* Page 1: Cover & Summary */}
        <div className="page" style={{ padding: '30px 35px', minHeight: '277mm', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ paddingBottom: '16px', marginBottom: '20px', borderBottom: `3px solid ${COLORS.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="logo-vitea" style={{ fontSize: '22px', fontWeight: 600, color: COLORS.primary, letterSpacing: '-0.02em' }}>Vitea</h1>
                <p style={{ fontSize: '11px', color: '#6b7280' }}>Rapport de Santé Personnalisé</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#4b5563' }}>
                <p>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p style={{ fontWeight: 500, color: COLORS.primary }}>{patientName}</p>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          {profile && (
            <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '6px', backgroundColor: COLORS.accent, fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div><span style={{ color: '#6b7280' }}>Âge:</span> <span style={{ fontWeight: 500 }}>{profile.age || 'N/A'} ans</span></div>
                <div><span style={{ color: '#6b7280' }}>Sexe:</span> <span style={{ fontWeight: 500 }}>{profile.sex === 'male' ? 'Homme' : profile.sex === 'female' ? 'Femme' : 'N/A'}</span></div>
                <div><span style={{ color: '#6b7280' }}>Taille:</span> <span style={{ fontWeight: 500 }}>{profile.height || 'N/A'} cm</span></div>
                <div><span style={{ color: '#6b7280' }}>Poids:</span> <span style={{ fontWeight: 500 }}>{profile.weight || 'N/A'} kg</span></div>
              </div>
            </div>
          )}

          {/* Analyses Info */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '10px' }}>Analyses Disponibles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {latestBlood && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '12px', marginBottom: '4px' }}>Analyse Sanguine</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{new Date(latestBlood.date).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{latestBlood.biomarkers.length} biomarqueurs analysés</div>
                </div>
              )}
              {latestDNA && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '12px', marginBottom: '4px' }}>Analyse ADN</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{new Date(latestDNA.date).toLocaleDateString('fr-FR')}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{latestDNA.totalSnps} variants analysés</div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '14px' }}>Synthèse</h2>
            
            {/* Global synthesis if available */}
            {synthesis?.globalSynthesis && (
              <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: COLORS.accent, borderRadius: '6px', borderLeft: `3px solid ${COLORS.primary}` }}>
                <p style={{ fontSize: '11px', color: '#1f2937', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {synthesis.globalSynthesis}
                </p>
              </div>
            )}
            
            {latestBlood && (
              <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: COLORS.primary }}>Bilan Sanguin</h3>
                <p style={{ fontSize: '11px', color: '#374151', lineHeight: 1.6 }}>
                  {synthesis?.bloodSynthesis || toThirdPerson(latestBlood.summary.split('\n').slice(0, 3).join(' '))}
                </p>
              </div>
            )}
            {latestDNA && (
              <div style={{ marginBottom: '18px', paddingBottom: '18px', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: COLORS.primary }}>Profil Génétique</h3>
                <p style={{ fontSize: '11px', color: '#374151', lineHeight: 1.6 }}>
                  {synthesis?.dnaSynthesis || toThirdPerson(latestDNA.summary.split('\n').slice(0, 3).join(' '))}
                </p>
              </div>
            )}
          </div>

          {/* Key Insights */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '14px' }}>Points Clés</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
              {synthesis?.keyPoints ? (
                synthesis.keyPoints.map((point, i) => (
                  <div key={`k-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px' }}>
                    <span style={{ color: COLORS.primary }}>→</span>
                    <span style={{ color: '#374151' }}>{point}</span>
                  </div>
                ))
              ) : (
                <>
                  {latestBlood?.insights?.slice(0, 3).map((insight, i) => (
                    <div key={`b-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px' }}>
                      <span style={{ color: COLORS.primary }}>→</span>
                      <span style={{ color: '#374151' }}>{toThirdPerson(insight)}</span>
                    </div>
                  ))}
                  {latestDNA?.insights?.slice(0, 3).map((insight, i) => (
                    <div key={`d-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px' }}>
                      <span style={{ color: COLORS.primary }}>→</span>
                      <span style={{ color: '#374151' }}>{toThirdPerson(insight)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <PageFooter pageNum={++currentPage} total={totalPages} />
        </div>

        {/* Page 2: Blood Analysis */}
        {latestBlood && (
          <div className="page" style={{ padding: '30px 35px', minHeight: '277mm', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '14px', paddingBottom: '8px', borderBottom: `2px solid ${COLORS.primary}` }}>
              Analyse Sanguine - {patientName}
            </h2>

            {/* Stats */}
            {bloodStats && (
              <div style={{ marginBottom: '14px', display: 'flex', gap: '16px', fontSize: '11px' }}>
                <span style={{ color: COLORS.success }}>● {bloodStats.normal} normaux</span>
                <span style={{ color: COLORS.warning }}>▲ {bloodStats.attention} à surveiller</span>
                {bloodStats.critical > 0 && <span style={{ color: COLORS.danger }}>◆ {bloodStats.critical} critiques</span>}
              </div>
            )}

            {/* Biomarkers Table */}
            <div style={{ flex: 1 }}>
              {Object.entries(groupedBiomarkers).map(([category, biomarkers]) => (
                <div key={category} style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: 600, color: 'white', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', marginBottom: '6px', backgroundColor: COLORS.primary }}>
                    {category}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '35%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Biomarqueur</th>
                        <th style={{ width: '20%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Valeur</th>
                        <th style={{ width: '25%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Référence</th>
                        <th style={{ width: '20%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {biomarkers.map((b, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '4px 4px 4px 0', color: '#1f2937', verticalAlign: 'middle' }}>{b.name}</td>
                          <td style={{ padding: '4px 4px 4px 0', color: '#374151', verticalAlign: 'middle' }}>{b.value} {b.unit}</td>
                          <td style={{ padding: '4px 4px 4px 0', color: '#6b7280', verticalAlign: 'middle' }}>{b.normalRange?.min} - {b.normalRange?.max} {b.unit}</td>
                          <td style={{ padding: '4px 4px 4px 0', color: getStatusColor(b.status), verticalAlign: 'middle' }}>{getStatusLabel(b.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <PageFooter pageNum={++currentPage} total={totalPages} />
          </div>
        )}

        {/* Page 3: DNA Analysis */}
        {latestDNA && (
          <div className="page" style={{ padding: '30px 35px', minHeight: '277mm', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '14px', paddingBottom: '8px', borderBottom: `2px solid ${COLORS.primary}` }}>
              Analyse Génétique - {patientName}
            </h2>

            {/* Stats */}
            {dnaStats && (
              <div style={{ marginBottom: '14px', display: 'flex', gap: '16px', fontSize: '11px' }}>
                <span style={{ color: COLORS.success }}>● {dnaStats.favorable} favorables</span>
                <span style={{ color: '#6b7280' }}>○ {dnaStats.neutral} neutres</span>
                <span style={{ color: COLORS.warning }}>▲ {dnaStats.risk} à risque</span>
              </div>
            )}

            {/* Categories */}
            <div style={{ flex: 1 }}>
              {latestDNA.categories.map((category, catIdx) => (
                <div key={catIdx} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', borderRadius: '4px', color: 'white', marginBottom: '6px', backgroundColor: COLORS.primary }}>
                    <h3 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{getDNACategoryLabel(category.name)}</h3>
                    <span style={{ fontSize: '10px', fontWeight: 600 }}>{category.snps.length} variants</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', tableLayout: 'fixed' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '15%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Gène</th>
                        <th style={{ width: '55%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Signification santé</th>
                        <th style={{ width: '15%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Génotype</th>
                        <th style={{ width: '15%', textAlign: 'left', fontWeight: 500, color: '#6b7280', paddingBottom: '6px', borderBottom: '1px solid #e5e7eb' }}>Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.snps.slice(0, 6).map((snp, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '4px 4px 4px 0', color: '#1f2937', verticalAlign: 'top', fontWeight: 500 }}>{snp.gene}</td>
                          <td style={{ padding: '4px 4px 4px 0', color: '#374151', verticalAlign: 'top', fontSize: '9px', lineHeight: 1.4 }}>{snp.trait || snp.description}</td>
                          <td style={{ padding: '4px 4px 4px 0', color: '#374151', fontFamily: 'ui-monospace, monospace', fontSize: '9px', verticalAlign: 'top' }}>{snp.genotype}</td>
                          <td style={{ padding: '4px 4px 4px 0', verticalAlign: 'top', color: snp.impact === 'favorable' ? COLORS.success : snp.impact === 'risk' ? COLORS.warning : COLORS.gray }}>
                            {getSNPImpactLabel(snp.impact)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {category.snps.length > 6 && (
                    <p style={{ fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>+ {category.snps.length - 6} autres variants</p>
                  )}
                </div>
              ))}
            </div>

            <PageFooter pageNum={++currentPage} total={totalPages} />
          </div>
        )}

        {/* Last Page: Recommendations */}
        <div className="page" style={{ padding: '30px 35px', minHeight: '277mm', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '14px', paddingBottom: '8px', borderBottom: `2px solid ${COLORS.primary}` }}>
            Recommandations - {patientName}
          </h2>

          <div style={{ flex: 1 }}>
            {/* Blood Recommendations */}
            {latestBlood?.recommendations && latestBlood.recommendations.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: COLORS.primary }}>
                  Basées sur l'Analyse Sanguine
                </h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {latestBlood.recommendations.slice(0, 5).map((rec, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', fontSize: '11px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: COLORS.primary, color: 'white', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ color: '#374151' }}>{toThirdPerson(rec)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* DNA Recommendations */}
            {latestDNA?.recommendations && latestDNA.recommendations.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px', color: COLORS.primary }}>
                  Basées sur l'Analyse Génétique
                </h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {latestDNA.recommendations.slice(0, 5).map((rec, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px', fontSize: '11px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: COLORS.primaryLight, color: 'white', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      <span style={{ color: '#374151' }}>{toThirdPerson(rec)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}


            {/* Disclaimer */}
            <div style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${COLORS.primary}`, backgroundColor: COLORS.grayLight }}>
              <h3 style={{ fontWeight: 600, marginBottom: '4px', fontSize: '10px', color: COLORS.primary }}>Avertissement</h3>
              <p style={{ fontSize: '9px', color: '#4b5563', lineHeight: 1.5 }}>
                Ce rapport est informatif et ne constitue pas un avis médical. Consultez un professionnel de santé qualifié pour toute question.
              </p>
            </div>
          </div>

          <PageFooter pageNum={++currentPage} total={totalPages} />
        </div>
      </div>
    </div>
  )
}
