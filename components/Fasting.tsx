'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Play, Pause, Clock, Info, Sparkles, X } from 'lucide-react'

// Les 8 zones scientifiques du jeûne 16/8 (corrigées pour être scientifiquement exactes)
const FASTING_ZONES = [
  {
    id: 1,
    name: 'Digestion active',
    duration: { start: 0, end: 2 }, // heures
    scientificName: 'Phase post-prandiale',
    description: 'Votre corps digère encore le dernier repas. Le glucose sanguin est élevé et l\'insuline est sécrétée pour stocker les nutriments.',
    processes: [
      'Digestion des aliments en cours',
      'Utilisation du glucose sanguin',
      'Sécrétion d\'insuline élevée',
      'Stockage du glycogène hépatique'
    ],
    benefits: 'Permet une transition douce vers le jeûne',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    detailedExplanation: `Pendant les 2 premières heures après votre dernier repas, votre système digestif est encore très actif. L'estomac et l'intestin grêle continuent de décomposer les aliments que vous avez consommés, libérant des nutriments dans la circulation sanguine.

Le pancréas sécrète de l'insuline en réponse à l'augmentation du glucose sanguin. Cette hormone permet aux cellules de votre corps d'absorber le glucose et de l'utiliser comme source d'énergie immédiate. Le foie commence également à stocker l'excès de glucose sous forme de glycogène.

Pendant cette phase, votre métabolisme utilise principalement le glucose provenant de votre dernier repas. Les niveaux d'insuline sont élevés, ce qui inhibe la lipolyse (décomposition des graisses) et favorise le stockage des nutriments. C'est une phase de transition où votre corps passe progressivement de l'état "alimenté" à l'état "à jeun".`
  },
  {
    id: 2,
    name: 'Transition métabolique',
    duration: { start: 2, end: 4 },
    scientificName: 'Fin de la digestion',
    description: 'La digestion se termine. Les niveaux d\'insuline commencent à baisser et le corps commence à puiser dans ses réserves de glycogène hépatique.',
    processes: [
      'Fin de la digestion',
      'Baisse progressive de l\'insuline',
      'Début de la glycogénolyse hépatique',
      'Stabilisation de la glycémie'
    ],
    benefits: 'Transition vers l\'état de jeûne',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    detailedExplanation: `Entre 2 et 4 heures après votre dernier repas, la digestion se termine progressivement. Les niveaux de glucose dans le sang commencent à diminuer car les aliments ont été absorbés. Le pancréas réduit sa production d'insuline en réponse à cette baisse.

Votre foie, qui stocke environ 100-120 grammes de glycogène, commence à libérer ce glycogène sous forme de glucose pour maintenir la glycémie stable. Ce processus s'appelle la glycogénolyse hépatique. Le glucose libéré est utilisé par le cerveau, les muscles et d'autres organes.

Pendant cette phase, votre corps fait la transition entre l'utilisation du glucose alimentaire et l'utilisation des réserves de glycogène. Les niveaux d'insuline diminuent, ce qui permet au glucagon (une hormone antagoniste) d'augmenter et de signaler au foie de libérer le glycogène stocké.`
  },
  {
    id: 3,
    name: 'Utilisation du glycogène',
    duration: { start: 4, end: 6 },
    scientificName: 'Glycogénolyse active',
    description: 'Le foie libère activement le glucose depuis ses réserves de glycogène. Le glycogène musculaire peut également être utilisé localement par les muscles.',
    processes: [
      'Glycogénolyse hépatique active',
      'Utilisation du glycogène musculaire',
      'Maintien de la glycémie stable',
      'Baisse continue de l\'insuline'
    ],
    benefits: 'Maintien de l\'énergie sans apport alimentaire',
    color: 'bg-green-100 text-green-800 border-green-300',
    detailedExplanation: `Entre 4 et 6 heures de jeûne, votre foie continue de libérer du glucose depuis ses réserves de glycogène. Cette phase est cruciale car elle permet à votre corps de maintenir une glycémie stable sans apport alimentaire.

Le glycogène hépatique (environ 100-120g) est progressivement épuisé. Pendant ce temps, le glycogène musculaire (environ 300-400g) peut être utilisé localement par les muscles lors d'activités, mais il ne peut pas être converti en glucose pour le reste du corps car les muscles n'ont pas l'enzyme nécessaire (glucose-6-phosphatase).

Les niveaux d'insuline continuent de baisser, ce qui permet au glucagon d'augmenter. Cette transition hormonale prépare votre corps à passer à l'utilisation des graisses comme source d'énergie principale.`
  },
  {
    id: 4,
    name: 'Épuisement du glycogène',
    duration: { start: 6, end: 8 },
    scientificName: 'Transition vers la lipolyse',
    description: 'Les réserves de glycogène hépatique s\'épuisent. Le corps commence à augmenter la lipolyse (décomposition des graisses) pour produire de l\'énergie.',
    processes: [
      'Épuisement progressif du glycogène hépatique',
      'Augmentation de la lipolyse',
      'Libération d\'acides gras libres',
      'Production minimale de corps cétoniques'
    ],
    benefits: 'Début de la transition vers la combustion des graisses',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    detailedExplanation: `Entre 6 et 8 heures de jeûne, les réserves de glycogène hépatique commencent à s'épuiser significativement. Votre corps doit trouver une nouvelle source d'énergie. C'est à ce moment que la lipolyse (décomposition des graisses) commence à s'intensifier.

Les cellules adipeuses (adipocytes) libèrent des acides gras libres dans la circulation sanguine sous l'influence du glucagon et de la baisse d'insuline. Ces acides gras sont transportés vers le foie et les muscles, où ils commencent à être utilisés pour produire de l'énergie via la bêta-oxydation.

Pendant cette phase, le foie peut commencer à produire de très petites quantités de corps cétoniques, mais la cétose nutritionnelle significative n'est pas encore établie. Cette phase représente une transition importante vers l'utilisation des graisses comme carburant principal.`
  },
  {
    id: 5,
    name: 'Augmentation de la lipolyse',
    duration: { start: 8, end: 10 },
    scientificName: 'Bêta-oxydation accrue',
    description: 'La lipolyse s\'intensifie. Les acides gras libres sont activement utilisés par le foie et les muscles. Le glycogène hépatique est presque épuisé.',
    processes: [
      'Lipolyse active',
      'Bêta-oxydation des acides gras',
      'Production d\'énergie à partir des graisses',
      'Glycogène hépatique presque épuisé'
    ],
    benefits: 'Combustion active des graisses',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    detailedExplanation: `Entre 8 et 10 heures de jeûne, la lipolyse est maintenant bien établie. Les acides gras libres circulent en grande quantité dans le sang et sont utilisés par le foie et les muscles pour produire de l'énergie via la bêta-oxydation.

Le foie commence à produire des corps cétoniques en quantités plus importantes, mais la cétose nutritionnelle significative (où les cétones deviennent une source d'énergie majeure pour le cerveau) n'est généralement pas encore atteinte. Cette phase nécessite généralement 12-16 heures de jeûne.

Pendant cette phase, votre sensibilité à l'insuline s'améliore déjà. Les cellules deviennent plus réceptives à l'insuline, ce qui signifie qu'elles peuvent utiliser le glucose plus efficacement lorsque vous reprenez à manger. Cette amélioration de la sensibilité à l'insuline est l'un des principaux bénéfices du jeûne intermittent pour la santé métabolique.`
  },
  {
    id: 6,
    name: 'Début de la cétose',
    duration: { start: 10, end: 12 },
    scientificName: 'Cétogenèse débutante',
    description: 'Le foie commence à produire des corps cétoniques de manière significative. Les cétones commencent à être utilisées comme source d\'énergie alternative.',
    processes: [
      'Production accrue de corps cétoniques',
      'Cétones utilisées par certains organes',
      'Réduction de la dépendance au glucose',
      'Autophagie débutante'
    ],
    benefits: 'Transition vers l\'utilisation des cétones',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    detailedExplanation: `Entre 10 et 12 heures de jeûne, le foie commence à produire des corps cétoniques en quantités plus significatives. Les trois types de corps cétoniques produits sont : l'acétoacétate, le bêta-hydroxybutyrate (BHB), et l'acétone.

Ces molécules commencent à être utilisées comme source d'énergie alternative par certains organes, bien que le cerveau utilise encore principalement le glucose à ce stade. La cétose nutritionnelle complète, où le cerveau utilise principalement les cétones, nécessite généralement 12-16 heures de jeûne.

L'autophagie commence également à s'activer pendant cette phase. L'autophagie est un processus cellulaire fondamental où les cellules "mangent" leurs propres composants endommagés ou inutiles. Ce processus de nettoyage cellulaire devient plus actif à mesure que le jeûne se prolonge.`
  },
  {
    id: 7,
    name: 'Cétose établie',
    duration: { start: 12, end: 14 },
    scientificName: 'Cétose nutritionnelle',
    description: 'La cétose nutritionnelle est maintenant établie. Le cerveau utilise activement les corps cétoniques. L\'autophagie s\'intensifie et l\'hormone de croissance (HGH) augmente.',
    processes: [
      'Cétose nutritionnelle établie',
      'Cétones utilisées par le cerveau',
      'Autophagie active',
      'Augmentation de l\'hormone de croissance (HGH)'
    ],
    benefits: 'Bénéfices métaboliques et régénération cellulaire',
    color: 'bg-red-100 text-red-800 border-red-300',
    detailedExplanation: `Après 12 heures de jeûne, la cétose nutritionnelle est maintenant bien établie. Le cerveau commence à utiliser activement les corps cétoniques comme source d'énergie principale, réduisant sa dépendance au glucose.

L'autophagie atteint un niveau d'activité significatif. Les cellules recyclent activement les composants endommagés, ce qui permet une réparation et une régénération. Les autophagosomes englobent les protéines mal repliées, les organites endommagés (comme les mitochondries dysfonctionnelles), et d'autres débris cellulaires.

La production d'hormone de croissance (HGH) commence à augmenter significativement. L'HGH peut augmenter jusqu'à 5 fois ses niveaux normaux pendant le jeûne prolongé. Cette hormone joue un rôle crucial dans la réparation tissulaire, la croissance musculaire, la régénération osseuse, et le métabolisme des graisses.

Pendant cette phase, les cellules activent également des voies de signalisation liées à la longévité, comme la voie mTOR (qui est inhibée) et la voie AMPK (qui est activée).`
  },
  {
    id: 8,
    name: 'Zone optimale',
    duration: { start: 14, end: 16 },
    scientificName: 'Cétose optimale et autophagie maximale',
    description: 'Vous êtes dans la zone optimale du jeûne 16/8. Cétose optimale, autophagie maximale, HGH à son pic, et réparation cellulaire complète.',
    processes: [
      'Cétose optimale',
      'Autophagie maximale',
      'HGH à son pic',
      'Réparation cellulaire complète',
      'Optimisation métabolique'
    ],
    benefits: 'Bénéfices maximaux du jeûne intermittent',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    detailedExplanation: `Entre 14 et 16 heures de jeûne, vous êtes dans la zone optimale du jeûne intermittent. Tous les processus bénéfiques sont à leur apogée : cétose optimale, autophagie maximale, HGH à son pic, et réparation cellulaire complète.

Pendant cette phase finale, votre métabolisme est parfaitement optimisé. Les corps cétoniques sont produits en grande quantité et utilisés efficacement par tous les organes, y compris le cerveau. Le cerveau fonctionne de manière optimale avec les cétones comme carburant principal, ce qui peut améliorer la clarté mentale et la concentration.

L'autophagie continue à nettoyer et réparer les cellules, éliminant les composants endommagés et remplaçant les structures vieillissantes. Les cellules souches sont activées et commencent à régénérer les tissus endommagés.

Les voies de signalisation de la longévité sont pleinement activées, créant un environnement cellulaire qui favorise la santé et la longévité. Les niveaux d'inflammation sont réduits, la sensibilité à l'insuline est optimale, et les mécanismes de réparation de l'ADN fonctionnent à pleine capacité.

C'est également pendant cette phase que les bénéfices cardiovasculaires du jeûne sont les plus prononcés, avec une amélioration de la fonction endothéliale (la couche interne des vaisseaux sanguins) et une réduction des marqueurs de stress oxydatif.`
  }
]

export default function FastingView() {
  const { profile, analyses, dnaAnalyses, fastingState: storeFastingState, setFastingState: setStoreFastingState } = useAppStore()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [currentZone, setCurrentZone] = useState<typeof FASTING_ZONES[0] | null>(null)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [selectedZone, setSelectedZone] = useState<typeof FASTING_ZONES[0] | null>(null)
  const [lastNotifiedZone, setLastNotifiedZone] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const latestBlood = analyses[0]
  const latestDNA = dnaAnalyses[0]
  
  // Calculer le temps écoulé depuis le startTime stocké
  const calculateElapsedSeconds = (startTime: number | null): number => {
    if (!startTime) return 0
    return Math.floor((Date.now() - startTime) / 1000)
  }

  // Demander la permission pour les notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Calculer la zone actuelle basée sur le temps écoulé et envoyer des notifications
  useEffect(() => {
    if (!storeFastingState?.isRunning || storeFastingState.startTime === null) {
      setCurrentZone(null)
      setLastNotifiedZone(null)
      return
    }

    const updateZone = () => {
      const currentElapsed = calculateElapsedSeconds(storeFastingState.startTime)
      const hours = currentElapsed / 3600
      const zone = FASTING_ZONES.find(z => 
        hours >= z.duration.start && hours < z.duration.end
      ) || FASTING_ZONES[FASTING_ZONES.length - 1]
      
      // Vérifier si on entre dans une nouvelle zone
      if (zone && zone.id !== lastNotifiedZone) {
        setLastNotifiedZone(zone.id)
        setCurrentZone(zone)
        
        // Envoyer une notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Nouvelle phase : ${zone.name}`, {
            body: `${zone.scientificName} • ${zone.duration.start}h - ${zone.duration.end}h\n\n${zone.description}`,
            icon: '/favicon.ico',
            tag: `fasting-zone-${zone.id}`,
            requireInteraction: false
          })
        }
      } else if (zone) {
        setCurrentZone(zone)
      }
    }

    updateZone()
    const zoneInterval = setInterval(updateZone, 60000) // Vérifier chaque minute
    return () => clearInterval(zoneInterval)
  }, [elapsedSeconds, storeFastingState?.isRunning, storeFastingState?.startTime, lastNotifiedZone])

  // Initialiser le temps écoulé depuis le store
  useEffect(() => {
    if (storeFastingState?.isRunning && storeFastingState.startTime) {
      setElapsedSeconds(calculateElapsedSeconds(storeFastingState.startTime))
    } else {
      setElapsedSeconds(0)
    }
  }, [storeFastingState?.isRunning, storeFastingState?.startTime])

  // Timer local pour l'affichage en temps réel
  useEffect(() => {
    if (storeFastingState?.isRunning && storeFastingState.startTime !== null) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsedSeconds(storeFastingState.startTime))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [storeFastingState?.isRunning, storeFastingState?.startTime])

  // Intervalle en arrière-plan qui continue même si le composant est démonté
  useEffect(() => {
    // Créer un intervalle global qui met à jour le store périodiquement
    // Cela permet au chronomètre de continuer même si l'utilisateur change de section
    if (storeFastingState?.isRunning && storeFastingState.startTime !== null) {
      backgroundIntervalRef.current = setInterval(() => {
        // Mettre à jour le store pour déclencher la persistance
        // Le startTime reste le même, mais on force une mise à jour
        setStoreFastingState({
          ...storeFastingState,
          startTime: storeFastingState.startTime
        })
      }, 60000) // Mise à jour toutes les minutes pour la persistance
    } else {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current)
        backgroundIntervalRef.current = null
      }
    }

    return () => {
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current)
      }
    }
  }, [storeFastingState?.isRunning, storeFastingState?.startTime, setStoreFastingState])

  const handleStart = () => {
    const now = Date.now()
    setStoreFastingState({
      isRunning: true,
      startTime: now,
      personalizedRecommendations: storeFastingState?.personalizedRecommendations
    })
    setElapsedSeconds(0)
  }

  const handleStop = () => {
    setStoreFastingState({
      isRunning: false,
      startTime: null,
      personalizedRecommendations: storeFastingState?.personalizedRecommendations
    })
    setElapsedSeconds(0)
  }

  const handleReset = () => {
    setStoreFastingState({
      isRunning: false,
      startTime: null,
      personalizedRecommendations: storeFastingState?.personalizedRecommendations
    })
    setElapsedSeconds(0)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleGenerateRecommendations = async () => {
    if (!profile?.openaiKey || !latestBlood || !latestDNA) {
      alert('Analyses sanguines et ADN requises pour générer des recommandations personnalisées')
      return
    }

    setIsLoadingRecommendations(true)
    try {
      const response = await fetch('/api/fasting-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          bloodAnalysis: latestBlood,
          dnaAnalysis: latestDNA
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des recommandations')
      }

      const data = await response.json()
      setStoreFastingState({
        ...storeFastingState || { isRunning: false, startTime: null },
        personalizedRecommendations: data.recommendations
      })
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(error.message || 'Erreur lors de la génération des recommandations')
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  const hours = Math.floor(elapsedSeconds / 3600)
  const minutes = Math.floor((elapsedSeconds % 3600) / 60)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Jeûne Intermittent</h1>
          <p className="text-text-secondary">Suivez votre jeûne 16/8 personnalisé en temps réel</p>
        </div>

        {/* Chronomètre */}
        <div className="bg-surface border border-border rounded-xl p-8 mb-6">
          <div className="flex flex-col items-center">
            <div className="text-6xl font-mono font-bold text-text-primary mb-6">
              {formatTime(elapsedSeconds)}
            </div>
            
            <div className="flex gap-4">
              {!storeFastingState?.isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
                >
                  <Play className="w-5 h-5" />
                  Démarrer
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Pause className="w-5 h-5" />
                  Arrêter
                </button>
              )}
              
              {elapsedSeconds > 0 && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-surface-alt text-text-primary rounded-lg hover:bg-surface-alt/80 transition-colors font-medium border border-border"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Zone actuelle */}
        {currentZone && (
          <div className="bg-surface border border-border rounded-xl p-6 mb-6 cursor-pointer hover:bg-surface-alt transition-colors" onClick={() => setSelectedZone(currentZone)}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-surface-alt border border-border flex items-center justify-center text-2xl font-bold text-text-primary">
                  {currentZone.id}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text-primary">{currentZone.name}</h2>
                  <span className="text-sm font-medium text-text-secondary">({currentZone.scientificName})</span>
                </div>
                <p className="text-base mb-4 leading-relaxed text-text-secondary">{currentZone.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-text-primary">Processus en cours :</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                      {currentZone.processes.map((process, idx) => (
                        <li key={idx}>{process}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-text-primary">Bénéfices :</h3>
                    <p className="text-sm text-text-secondary">{currentZone.benefits}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span>
                      Zone {currentZone.duration.start}h - {currentZone.duration.end}h • 
                      Vous êtes à {hours}h {minutes}min de jeûne
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-text-muted">
                    Cliquez pour en savoir plus sur ce qui se passe dans votre corps
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommandations personnalisées */}
        {storeFastingState?.personalizedRecommendations ? (
          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent-primary" />
              <h2 className="text-xl font-bold text-text-primary">Recommandations personnalisées</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Heure optimale de début :</h3>
                <p className="text-text-secondary">{storeFastingState.personalizedRecommendations.optimalStartTime}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Durée recommandée :</h3>
                <p className="text-text-secondary">{storeFastingState.personalizedRecommendations.duration} heures</p>
              </div>
              
              {storeFastingState.personalizedRecommendations.warnings.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-orange-600">⚠️ Avertissements :</h3>
                  <ul className="list-disc list-inside space-y-1 text-text-secondary">
                    {storeFastingState.personalizedRecommendations.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Bénéfices pour vous :</h3>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  {storeFastingState.personalizedRecommendations.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Adaptations recommandées :</h3>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  {storeFastingState.personalizedRecommendations.adaptations.map((adaptation, idx) => (
                    <li key={idx}>{adaptation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-2">Recommandations personnalisées</h3>
                <p className="text-sm text-text-secondary">
                  Générez des recommandations basées sur vos analyses sanguines et ADN
                </p>
              </div>
              <button
                onClick={handleGenerateRecommendations}
                disabled={isLoadingRecommendations || !latestBlood || !latestDNA}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingRecommendations ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Toutes les zones */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Les 8 zones du jeûne 16/8</h2>
          <div className="space-y-3">
            {FASTING_ZONES.map((zone) => (
              <div
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-surface-alt transition-colors ${
                  currentZone?.id === zone.id ? 'ring-2 ring-accent-primary/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-alt border border-border flex items-center justify-center font-bold text-text-primary">
                    {zone.id}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-text-primary">{zone.name}</h3>
                      <span className="text-sm text-text-secondary">({zone.scientificName})</span>
                    </div>
                    <p className="text-sm mb-2 text-text-secondary">{zone.duration.start}h - {zone.duration.end}h</p>
                    <p className="text-sm text-text-secondary">{zone.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de détail */}
      {selectedZone && (
        <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedZone(null)}>
          <div className="bg-surface border border-border rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-surface border-b border-border p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary">{selectedZone.name}</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {selectedZone.scientificName} • Zone {selectedZone.duration.start}h - {selectedZone.duration.end}h
                </p>
              </div>
              <button
                onClick={() => setSelectedZone(null)}
                className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-text-primary">Description</h3>
                <p className="text-text-secondary leading-relaxed">{selectedZone.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-text-primary">Ce qui se passe dans votre corps</h3>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">{selectedZone.detailedExplanation}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-text-primary">Processus en cours</h3>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  {selectedZone.processes.map((process, idx) => (
                    <li key={idx}>{process}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3 text-text-primary">Bénéfices</h3>
                <p className="text-text-secondary">{selectedZone.benefits}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

