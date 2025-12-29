import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createIndexedDBStorage } from './indexeddb-storage'

export interface UserProfile {
  firstName: string
  lastName: string
  age: number
  sex: 'male' | 'female' | 'other'
  weight: number
  height: number
  sedentaryLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  medicalConditions: string
  openaiKey: string
}

export interface Biomarker {
  name: string
  value: number
  unit: string
  normalRange: { min: number; max: number }
  status: 'optimal' | 'standard' | 'attention'
  category: string
  description?: string
  recommendation?: string
}

export interface AnalysisResult {
  id: string
  date: string
  fileName: string
  biomarkers: Biomarker[]
  summary: string
  insights: string[]
  recommendations: string[]
  overallScore: number
}

// DNA Analysis Types
export interface SNPResult {
  rsid: string
  chromosome: string
  position: number
  genotype: string
  gene?: string
  trait: string
  impact: 'positive' | 'neutral' | 'risk'
  riskLevel?: 'low' | 'moderate' | 'high'
  description: string
  recommendation?: string
}

export interface DNACategory {
  id: string
  name: string
  score: number
  status: 'excellent' | 'good' | 'moderate' | 'attention'
  snps: SNPResult[]
  summary: string
}

export interface DNAAnalysisResult {
  id: string
  date: string
  fileName: string
  source: '23andme' | 'ancestry' | 'myheritage' | 'ftdna' | 'other'
  totalSnps: number
  analyzedSnps: number
  categories: DNACategory[]
  summary: string
  insights: string[]
  recommendations: string[]
  overallScore: number
}

// Health Plan Types
export interface HealthPlan {
  id: string
  generatedAt: string
  summary: string
  dailyTodos?: Array<{
    id: string
    category: 'nutrition' | 'fitness' | 'behavior' | 'weight' | 'health'
    task: string
    priority: 'high' | 'medium' | 'low'
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime'
    completed?: boolean
  }>
  weightManagement?: {
    currentWeight: number
    recommendedWeight: number
    reasoning: string
    personalizedDiet: {
      dailyCalories: number
      macronutrients: {
        proteins: { grams: number; percentage: number }
        carbs: { grams: number; percentage: number }
        fats: { grams: number; percentage: number }
      }
      mealPlan: string[]
      keyPrinciples: string[]
    }
    weightProgression: Array<{
      week: number
      targetWeight: number
      milestone: string
    }>
  }
  nutrition: {
    focus: string[]
    avoid: string[]
    mealsGuidelines: string[]
    hydration: string
    supplements: string[]
  }
  fitness: {
    weeklyGoal: string
    cardio: string
    strength: string
    mobility: string
    rest: string
    plan: string[]
  }
  behavior: {
    sleep: string[]
    stress: string[]
    recovery: string[]
    mindfulness: string[]
    other: string[]
  }
  bloodInsights: string[]
  dnaInsights: string[]
  synergies: string[]
}

// Report Types
export interface GeneratedReport {
  id: string
  generatedAt: string
  titre: string
  dateRapport: string
  resumeExecutif: string
  profilPatient: {
    description: string
    facteurs: string[]
  }
  analyseSanguine: {
    interpretation: string
    biomarqueursDetails: Array<{
      nom: string
      valeur: string
      reference: string
      interpretation: string
      statut: 'normal' | 'attention' | 'critique'
    }>
    pointsAttention: string[]
    pointsPositifs: string[]
  }
  analyseGenetique: {
    interpretation: string
    variantsDetails: Array<{
      gene: string
      variant: string
      genotype: string
      impact: 'favorable' | 'neutre' | 'risque'
      interpretation: string
    }>
    predispositions: string[]
    atouts: string[]
  }
  syntheseCroisee: {
    analyse: string
    correlations: string[]
  }
  recommandations: {
    prioritaires: string[]
    nutrition: string[]
    activitePhysique: string[]
    suivi: string[]
  }
  conclusion: string
  _rawData?: {
    biomarkers: any[]
    snps: any[]
    bloodScore: number
    dnaScore: number
    patientName: string
    generatedAt: string
  }
}

// Export data structure
export interface ExportData {
  version: string
  exportedAt: string
  profile: UserProfile | null
  analyses: AnalysisResult[]
  dnaAnalyses: DNAAnalysisResult[]
  healthPlan: HealthPlan | null
  report: GeneratedReport | null
  chatMessages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  recommendedAnalyses: Array<{
    id: string
    name: string
    description: string
    frequency: string
    priority: 'high' | 'medium' | 'low'
    category: string
    completed: boolean
    includes?: string[]
  }>
  hasCompletedOnboarding: boolean
}

interface AppState {
  // User profile
  profile: UserProfile | null
  setProfile: (profile: UserProfile) => void
  
  // Blood Analysis results
  analyses: AnalysisResult[]
  addAnalysis: (analysis: AnalysisResult) => void
  clearAnalyses: () => void
  
  // DNA Analysis results
  dnaAnalyses: DNAAnalysisResult[]
  addDNAAnalysis: (analysis: DNAAnalysisResult) => void
  clearDNAAnalyses: () => void
  
  // Health Plan
  healthPlan: HealthPlan | null
  setHealthPlan: (plan: HealthPlan) => void
  clearHealthPlan: () => void
  toggleDailyTodoCompleted: (todoId: string) => void
  
  // Generated Report
  report: GeneratedReport | null
  setReport: (report: GeneratedReport) => void
  clearReport: () => void
  
  // Chat Messages (timestamp stored as ISO string)
  chatMessages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
  setChatMessages: (messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>) => void
  addChatMessage: (message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }) => void
  clearChatMessages: () => void
  
  // Recommended Analyses
  recommendedAnalyses: Array<{
    id: string
    name: string
    description: string
    frequency: string
    priority: 'high' | 'medium' | 'low'
    category: string
    completed: boolean
    includes?: string[]
  }>
  setRecommendedAnalyses: (analyses: Array<{
    id: string
    name: string
    description: string
    frequency: string
    priority: 'high' | 'medium' | 'low'
    category: string
    completed: boolean
    includes?: string[]
  }>) => void
  toggleAnalysisCompleted: (id: string) => void
  
  // Fasting State
  fastingState: {
    isRunning: boolean
    startTime: number | null
    personalizedRecommendations?: {
      optimalStartTime: string
      duration: number
      warnings: string[]
      benefits: string[]
      adaptations: string[]
    }
  } | null
  setFastingState: (state: {
    isRunning: boolean
    startTime: number | null
    personalizedRecommendations?: {
      optimalStartTime: string
      duration: number
      warnings: string[]
      benefits: string[]
      adaptations: string[]
    }
  } | null) => void
  
  // Current analysis state
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void
  analysisProgress: number
  setAnalysisProgress: (progress: number) => void
  
  // Onboarding
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (completed: boolean) => void
  
  // Import/Export
  exportData: () => ExportData
  importData: (data: ExportData) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User profile
      profile: null,
      setProfile: (profile) => set({ profile }),
      
      // Blood Analysis results
      analyses: [],
      addAnalysis: (analysis) =>
        set((state) => ({ analyses: [analysis, ...state.analyses] })),
      clearAnalyses: () => set({ analyses: [] }),
      
      // DNA Analysis results
      dnaAnalyses: [],
      addDNAAnalysis: (analysis) =>
        set((state) => ({ dnaAnalyses: [analysis, ...state.dnaAnalyses] })),
      clearDNAAnalyses: () => set({ dnaAnalyses: [] }),
      
  // Health Plan
  healthPlan: null,
  setHealthPlan: (plan) => set({ healthPlan: plan }),
  clearHealthPlan: () => set({ healthPlan: null }),
  toggleDailyTodoCompleted: (todoId) => set((state) => {
    if (!state.healthPlan || !state.healthPlan.dailyTodos) return state
    return {
      healthPlan: {
        ...state.healthPlan,
        dailyTodos: state.healthPlan.dailyTodos.map(todo =>
          todo.id === todoId
            ? { ...todo, completed: !todo.completed }
            : todo
        ),
      },
    }
  }),
  
  // Generated Report
  report: null,
  setReport: (report) => set({ report }),
  clearReport: () => set({ report: null }),
  
  // Chat Messages
  chatMessages: [],
  setChatMessages: (messages) => set({ chatMessages: messages }),
  addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  
  // Recommended Analyses
  recommendedAnalyses: [],
  setRecommendedAnalyses: (analyses) => set({ recommendedAnalyses: analyses }),
  toggleAnalysisCompleted: (id) => set((state) => ({
    recommendedAnalyses: state.recommendedAnalyses.map(a => 
      a.id === id ? { ...a, completed: !a.completed } : a
    )
  })),
  
  // Fasting State
  fastingState: null,
  setFastingState: (state) => set({ fastingState: state }),
      
      // Current analysis state
      isAnalyzing: false,
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      analysisProgress: 0,
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      
      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed) =>
        set({ hasCompletedOnboarding: completed }),
      
      // Import/Export
      exportData: () => {
        const state = get()
        return {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          profile: state.profile,
          analyses: state.analyses,
          dnaAnalyses: state.dnaAnalyses,
          healthPlan: state.healthPlan,
          report: state.report,
          chatMessages: state.chatMessages,
          recommendedAnalyses: state.recommendedAnalyses,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
        }
      },
      importData: (data: ExportData) => {
        set({
          profile: data.profile,
          analyses: data.analyses || [],
          dnaAnalyses: data.dnaAnalyses || [],
          healthPlan: data.healthPlan,
          report: data.report || null,
          chatMessages: data.chatMessages || [],
          recommendedAnalyses: data.recommendedAnalyses || [],
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? false,
        })
      },
    }),
    {
      name: 'sang-analyzer-storage',
      storage: typeof window !== 'undefined' ? createIndexedDBStorage() : undefined,
      partialize: (state) => ({
        profile: state.profile,
        analyses: state.analyses,
        dnaAnalyses: state.dnaAnalyses,
        healthPlan: state.healthPlan,
        report: state.report,
        chatMessages: state.chatMessages,
        recommendedAnalyses: state.recommendedAnalyses,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
)

// Utility functions
export const getSedentaryLabel = (level: UserProfile['sedentaryLevel']): string => {
  const labels = {
    sedentary: 'Sédentaire',
    light: 'Légèrement actif',
    moderate: 'Modérément actif',
    active: 'Actif',
    very_active: 'Très actif',
  }
  return labels[level]
}

export const getStatusColor = (status: Biomarker['status']): string => {
  const colors = {
    optimal: '#1e5631',
    standard: '#2563eb',
    attention: '#dc2626',
  }
  return colors[status]
}

export const getStatusLabel = (status: Biomarker['status']): string => {
  const labels = {
    optimal: 'Optimal',
    standard: 'Standard',
    attention: 'À surveiller',
  }
  return labels[status]
}

// DNA utility functions
export const getDNACategoryColor = (status: DNACategory['status']): string => {
  const colors = {
    excellent: '#1e5631',
    good: '#2d7a45',
    moderate: '#d97706',
    attention: '#dc2626',
  }
  return colors[status]
}

export const getDNACategoryLabel = (status: DNACategory['status']): string => {
  const labels = {
    excellent: 'Excellent',
    good: 'Bon',
    moderate: 'Modéré',
    attention: 'À surveiller',
  }
  return labels[status]
}

export const getSNPImpactColor = (impact: SNPResult['impact']): string => {
  const colors = {
    positive: '#1e5631',
    neutral: '#6b7280',
    risk: '#dc2626',
  }
  return colors[impact]
}

export const getSNPImpactLabel = (impact: SNPResult['impact']): string => {
  const labels = {
    positive: 'Favorable',
    neutral: 'Neutre',
    risk: 'À risque',
  }
  return labels[impact]
}

export const getRiskLevelLabel = (level: SNPResult['riskLevel']): string => {
  const labels = {
    low: 'Faible',
    moderate: 'Modéré',
    high: 'Élevé',
  }
  return labels?.[level || 'low'] || 'Inconnu'
}
