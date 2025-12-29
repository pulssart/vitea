'use client'

import { useState } from 'react'
import { useAppStore, UserProfile } from '@/lib/store'
import { ArrowRight, ArrowLeft, Check } from 'lucide-react'

const steps = [
  { id: 1, title: 'Identité' },
  { id: 2, title: 'Profil santé' },
  { id: 3, title: 'Configuration' },
]

export default function Onboarding() {
  const { setProfile, setHasCompletedOnboarding } = useAppStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    firstName: '',
    lastName: '',
    age: 30,
    sex: 'male',
    weight: 70,
    height: 175,
    sedentaryLevel: 'moderate',
    medicalConditions: '',
    openaiKey: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (currentStep === 1) {
      if (!formData.firstName?.trim()) newErrors.firstName = 'Prénom requis'
      if (!formData.lastName?.trim()) newErrors.lastName = 'Nom requis'
    }
    
    if (currentStep === 2) {
      if (!formData.age || formData.age < 1 || formData.age > 150) {
        newErrors.age = 'Âge invalide'
      }
      if (!formData.weight || formData.weight < 20 || formData.weight > 500) {
        newErrors.weight = 'Poids invalide'
      }
      if (!formData.height || formData.height < 50 || formData.height > 300) {
        newErrors.height = 'Taille invalide'
      }
    }
    
    if (currentStep === 3) {
      if (!formData.openaiKey?.trim()) {
        newErrors.openaiKey = 'Clé API OpenAI requise'
      } else if (!formData.openaiKey.startsWith('sk-')) {
        newErrors.openaiKey = 'Clé API invalide (doit commencer par sk-)'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1)
      } else {
        handleComplete()
      }
    }
  }

  const handleComplete = () => {
    setProfile(formData as UserProfile)
    setHasCompletedOnboarding(true)
  }

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-6">
            <span 
              className="font-display text-4xl font-semibold tracking-tight"
              style={{ color: 'rgba(30, 85, 49, 1)', fontSize: '113px', marginBottom: '97px', display: 'inline-block' }}
            >Vitea</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-text-primary mb-2" style={{ marginTop: '42px' }}>
            Bienvenue
          </h1>
          <p className="text-text-secondary">
            Configurez votre profil pour une analyse personnalisée
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors
                ${currentStep > step.id 
                  ? 'bg-accent-primary text-white' 
                  : currentStep === step.id
                  ? 'bg-accent-primary text-white'
                  : 'bg-surface-alt text-text-muted border border-border'}
              `}>
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-px mx-2 ${currentStep > step.id ? 'bg-accent-primary' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-surface border border-border rounded-2xl p-8 shadow-soft">
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Vos informations
                </h2>
                <p className="text-sm text-text-secondary">
                  Ces informations nous permettent de personnaliser vos résultats.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    className={`
                      w-full px-4 py-3 bg-surface rounded-xl border text-text-primary
                      ${errors.firstName ? 'border-status-attention' : 'border-border'}
                    `}
                    placeholder="Jean"
                  />
                  {errors.firstName && (
                    <p className="text-status-attention text-sm mt-1.5">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    className={`
                      w-full px-4 py-3 bg-surface rounded-xl border text-text-primary
                      ${errors.lastName ? 'border-status-attention' : 'border-border'}
                    `}
                    placeholder="Dupont"
                  />
                  {errors.lastName && (
                    <p className="text-status-attention text-sm mt-1.5">{errors.lastName}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Profil santé
                </h2>
                <p className="text-sm text-text-secondary">
                  Ces données contextualisent l'analyse de vos résultats.
                </p>
              </div>

              {/* Sexe */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Sexe
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[
                    { value: 'male', label: 'Homme' },
                    { value: 'female', label: 'Femme' },
                    { value: 'other', label: 'Autre' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('sex', option.value)}
                      className={`
                        py-3 px-4 rounded-xl border text-sm font-medium transition-colors
                        ${formData.sex === option.value 
                          ? 'bg-accent-secondary border-accent-primary text-accent-primary' 
                          : 'bg-surface border-border text-text-secondary hover:border-text-muted'}
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Âge
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateField('age', parseInt(e.target.value))}
                      className={`
                        w-full px-4 py-3 bg-surface rounded-xl border text-text-primary
                        ${errors.age ? 'border-status-attention' : 'border-border'}
                      `}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                      ans
                    </span>
                  </div>
                  {errors.age && (
                    <p className="text-status-attention text-sm mt-1.5">{errors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Poids
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => updateField('weight', parseInt(e.target.value))}
                      className={`
                        w-full px-4 py-3 bg-surface rounded-xl border text-text-primary
                        ${errors.weight ? 'border-status-attention' : 'border-border'}
                      `}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                      kg
                    </span>
                  </div>
                  {errors.weight && (
                    <p className="text-status-attention text-sm mt-1.5">{errors.weight}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Taille
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => updateField('height', parseInt(e.target.value))}
                      className={`
                        w-full px-4 py-3 bg-surface rounded-xl border text-text-primary
                        ${errors.height ? 'border-status-attention' : 'border-border'}
                      `}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                      cm
                    </span>
                  </div>
                  {errors.height && (
                    <p className="text-status-attention text-sm mt-1.5">{errors.height}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Niveau d'activité physique
                </label>
                <div className="grid gap-2 sm:grid-cols-5">
                  {[
                    { value: 'sedentary', label: 'Sédentaire' },
                    { value: 'light', label: 'Léger' },
                    { value: 'moderate', label: 'Modéré' },
                    { value: 'active', label: 'Actif' },
                    { value: 'very_active', label: 'Très actif' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateField('sedentaryLevel', option.value)}
                      className={`
                        py-3 px-2 rounded-xl border text-sm font-medium transition-colors
                        ${formData.sedentaryLevel === option.value 
                          ? 'bg-accent-secondary border-accent-primary text-accent-primary' 
                          : 'bg-surface border-border text-text-secondary hover:border-text-muted'}
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditions médicales */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Conditions médicales particulières
                  <span className="text-text-muted font-normal ml-1">(optionnel)</span>
                </label>
                <textarea
                  value={formData.medicalConditions}
                  onChange={(e) => updateField('medicalConditions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface rounded-xl border border-border text-text-primary resize-none"
                  placeholder="Ex: Diabète type 2, hypertension, allergies alimentaires, médicaments en cours..."
                />
                <p className="text-xs text-text-muted mt-2">
                  Ces informations seront prises en compte dans l'analyse IA pour des recommandations personnalisées.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  Configuration API
                </h2>
                <p className="text-sm text-text-secondary">
                  Entrez votre clé API OpenAI pour activer l'analyse IA.
                </p>
              </div>

              <div className="bg-surface-alt rounded-xl p-4 border border-border">
                <p className="text-sm text-text-secondary">
                  <span className="font-medium text-text-primary">Comment obtenir une clé ?</span>
                  <br />
                  Rendez-vous sur{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:underline"
                  >
                    platform.openai.com/api-keys
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Clé API OpenAI
                </label>
                <input
                  type="password"
                  value={formData.openaiKey}
                  onChange={(e) => updateField('openaiKey', e.target.value)}
                  className={`
                    w-full px-4 py-3 bg-surface rounded-xl border font-mono text-sm text-text-primary
                    ${errors.openaiKey ? 'border-status-attention' : 'border-border'}
                  `}
                  placeholder="sk-..."
                />
                {errors.openaiKey && (
                  <p className="text-status-attention text-sm mt-1.5">{errors.openaiKey}</p>
                )}
              </div>

              <div className="flex items-start gap-3 p-4 bg-accent-secondary rounded-xl">
                <svg className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-sm text-accent-primary">
                  Votre clé est stockée localement sur votre appareil et n'est jamais transmise à nos serveurs.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-colors
                ${currentStep === 1 
                  ? 'opacity-0 pointer-events-none' 
                  : 'btn-secondary'}
              `}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium btn-primary"
            >
              {currentStep === 3 ? 'Commencer' : 'Continuer'}
              {currentStep === 3 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-text-muted mt-6">
          En continuant, vous acceptez nos conditions d'utilisation.
        </p>
      </div>
    </div>
  )
}
