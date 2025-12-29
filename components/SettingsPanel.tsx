'use client'

import { useState, useRef } from 'react'
import { useAppStore, getSedentaryLabel, UserProfile, ExportData } from '@/lib/store'
import { Save, Trash2, AlertTriangle, CheckCircle, Eye, EyeOff, LogOut, Download, Upload } from 'lucide-react'

export default function SettingsPanel() {
  const { 
    profile, 
    setProfile, 
    analyses, 
    dnaAnalyses,
    healthPlan,
    clearAnalyses,
    clearDNAAnalyses,
    clearHealthPlan,
    setHasCompletedOnboarding,
    exportData,
    importData
  } = useAppStore()
  
  const [formData, setFormData] = useState<Partial<UserProfile>>(profile || {})
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    setProfile(formData as UserProfile)
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleDeleteAnalyses = () => {
    clearAnalyses()
    setShowDeleteConfirm(false)
  }

  const handleReset = () => {
    setProfile(null as any)
    clearAnalyses()
    clearDNAAnalyses()
    clearHealthPlan()
    setHasCompletedOnboarding(false)
  }

  const handleExport = () => {
    try {
      const data = exportData()
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `vitea-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      setImportError('Erreur lors de l\'export des données')
      setTimeout(() => setImportError(null), 3000)
    }
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data: ExportData = JSON.parse(content)
        
        // Validation basique
        if (!data.version || !data.exportedAt) {
          throw new Error('Format de fichier invalide')
        }

        // Demander confirmation avant d'importer
        if (window.confirm(
          'Importer ces données remplacera toutes vos données actuelles. Voulez-vous continuer ?'
        )) {
          importData(data)
          setImportSuccess(true)
          setTimeout(() => {
            setImportSuccess(false)
            window.location.reload() // Recharger pour appliquer les changements
          }, 2000)
        }
      } catch (error) {
        console.error('Erreur lors de l\'import:', error)
        setImportError('Format de fichier invalide ou corrompu')
        setTimeout(() => setImportError(null), 5000)
      }
    }
    reader.readAsText(file)
    
    // Réinitialiser l'input pour permettre de réimporter le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-text-primary mb-1">Paramètres</h1>
        <p className="text-text-secondary">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-text-primary mb-5">Profil</h2>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Prénom</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg border border-border text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Nom</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="w-full px-4 py-2.5 bg-surface rounded-lg border border-border text-text-primary"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Âge</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => updateField('age', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg border border-border text-text-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">ans</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Poids</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => updateField('weight', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg border border-border text-text-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">kg</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Taille</label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => updateField('height', parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-surface rounded-lg border border-border text-text-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">cm</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Niveau d'activité</label>
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
                    py-2.5 px-2 rounded-lg border text-sm font-medium transition-colors
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
        </div>
      </div>

      {/* API Key */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-text-primary mb-5">Clé API OpenAI</h2>

        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={formData.openaiKey || ''}
            onChange={(e) => updateField('openaiKey', e.target.value)}
            className="w-full px-4 py-2.5 pr-12 bg-surface rounded-lg border border-border font-mono text-sm text-text-primary"
            placeholder="sk-..."
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors"
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <p className="text-sm text-text-muted mt-3">
          Votre clé est stockée localement et utilisée uniquement pour les analyses.
        </p>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium btn-primary"
      >
        {isSaving ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : saveSuccess ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Enregistré
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Enregistrer
          </>
        )}
      </button>

      {/* Import/Export */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-text-primary mb-4">Sauvegarde et restauration</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-surface-alt rounded-lg">
            <div>
              <p className="font-medium text-text-primary text-sm">Exporter les données</p>
              <p className="text-xs text-text-muted">
                Télécharger toutes vos données en JSON
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm btn-primary"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-alt rounded-lg">
            <div>
              <p className="font-medium text-text-primary text-sm">Importer les données</p>
              <p className="text-xs text-text-muted">
                Restaurer depuis un fichier JSON
              </p>
            </div>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm btn-secondary"
            >
              <Upload className="w-4 h-4" />
              Importer
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {importError}
            </div>
          )}

          {importSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Données importées avec succès !
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-text-primary mb-4">Données</h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-surface-alt rounded-lg">
            <div>
              <p className="font-medium text-text-primary text-sm">Supprimer les analyses</p>
              <p className="text-xs text-text-muted">
                {analyses.length} analyse(s) sang
              </p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={analyses.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-status-attention hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-surface-alt rounded-lg">
            <div>
              <p className="font-medium text-text-primary text-sm">Réinitialiser</p>
              <p className="text-xs text-text-muted">
                Supprimer profil, analyses sang, analyses ADN et plan
              </p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-status-attention hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-surface rounded-xl max-w-sm w-full p-6 border border-border shadow-medium animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-status-attention" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
              Supprimer les analyses ?
            </h3>
            <p className="text-text-secondary text-center text-sm mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-lg font-medium btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAnalyses}
                className="flex-1 py-2.5 rounded-lg font-medium bg-status-attention text-white hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {showResetConfirm && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 min-h-screen z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="bg-surface rounded-xl max-w-sm w-full p-6 border border-border shadow-medium animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-status-attention" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary text-center mb-2">
              Réinitialiser l'application ?
            </h3>
            <p className="text-text-secondary text-center text-sm mb-6">
              Toutes vos données seront supprimées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-lg font-medium btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-lg font-medium bg-status-attention text-white hover:bg-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
