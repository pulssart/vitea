import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { bloodAnalysis, dnaAnalysis, profile, apiKey } = await request.json()

    if (!bloodAnalysis || !dnaAnalysis) {
      return NextResponse.json(
        { message: 'Les analyses de sang et ADN sont requises' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { message: 'Clé API OpenAI manquante' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Préparer le contexte du profil
    const profileContext = profile ? `
PROFIL DE L'UTILISATEUR:
- Prénom: ${profile.firstName}
- Sexe: ${profile.sex === 'male' ? 'Homme' : profile.sex === 'female' ? 'Femme' : 'Autre'}
- Âge: ${profile.age} ans
- Poids: ${profile.weight} kg
- Taille: ${profile.height} cm
- IMC: ${(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
- Niveau d'activité actuel: ${profile.sedentaryLevel}
${profile.medicalConditions ? `- CONDITIONS MÉDICALES À PRENDRE EN COMPTE: ${profile.medicalConditions}` : ''}
` : ''

    // Préparer le résumé des biomarqueurs sanguins (tronqué pour limiter le prompt)
    const topBlood = bloodAnalysis.biomarkers.slice(0, 30)
    const bloodSummary = `
ANALYSE DE SANG (Score: ${bloodAnalysis.overallScore}/100)
${topBlood.map((b: any) => 
  `- ${b.name}: ${b.value} ${b.unit} (${b.status}) [Réf ${b.normalRange.min}-${b.normalRange.max}]`
).join('\n')}
${bloodAnalysis.biomarkers.length > topBlood.length ? `... (${bloodAnalysis.biomarkers.length - topBlood.length} biomarqueurs supplémentaires)` : ''}

Points clés sang (top 5):
${bloodAnalysis.insights.slice(0,5).join('\n')}
`

    // Préparer le résumé ADN (tronqué pour limiter le prompt)
    const dnaSummary = `
ANALYSE ADN (Score: ${dnaAnalysis.overallScore}/100)
${dnaAnalysis.categories.map((c: any) => {
  const snps = (c.snps || []).slice(0, 5)
  return `- ${c.name} (${c.status}): ${snps.map((s: any) => `${s.gene} ${s.genotype} (${s.impact})`).join(', ')}${(c.snps?.length || 0) > snps.length ? ' ...' : ''}`
}).join('\n')}

Points clés ADN (top 5):
${dnaAnalysis.insights.slice(0,5).join('\n')}
`

    let response
    try {
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `Tu es un expert en nutrition et fitness. Crée un plan santé personnalisé basé sur les analyses sang et ADN.

${profileContext}

${bloodSummary}

${dnaSummary}

Réponds UNIQUEMENT en JSON avec cette structure exacte:

{
  "summary": "Résumé en 2 phrases",
  "dailyTodos": [
    {
      "id": "unique-id-1",
      "category": "nutrition|fitness|behavior|weight|health",
      "task": "Tâche concrète et actionnable à faire aujourd'hui (ex: 'Boire 2L d'eau', 'Faire 30min de marche', 'Prendre suppléments vitamine D')",
      "priority": "high|medium|low",
      "timeOfDay": "morning|afternoon|evening|anytime"
    }
  ],
  "weightManagement": {
    "currentWeight": ${profile?.weight || 70},
    "recommendedWeight": <poids idéal calculé basé sur IMC, analyses, conditions médicales>,
    "reasoning": "Explication détaillée du poids recommandé en tenant compte de l'IMC actuel, des biomarqueurs sanguins (ex: cholestérol, glycémie), des prédispositions ADN, et des conditions médicales",
    "personalizedDiet": {
      "dailyCalories": <calories quotidiennes recommandées>,
      "macronutrients": {
        "proteins": { "grams": <g>, "percentage": <%> },
        "carbs": { "grams": <g>, "percentage": <%> },
        "fats": { "grams": <g>, "percentage": <%> }
      },
      "mealPlan": ["Exemple petit-déjeuner personnalisé", "Exemple déjeuner", "Exemple dîner", "Collations recommandées"],
      "keyPrinciples": ["Principe nutritionnel 1 basé sur analyses", "Principe 2", "..."]
    },
    "weightProgression": [
      { "week": 0, "targetWeight": <poids actuel>, "milestone": "Départ" },
      { "week": 4, "targetWeight": <poids semaine 4>, "milestone": "Premier mois" },
      { "week": 8, "targetWeight": <poids semaine 8>, "milestone": "Deux mois" },
      { "week": 12, "targetWeight": <poids semaine 12>, "milestone": "Trois mois" },
      { "week": 16, "targetWeight": <poids semaine 16>, "milestone": "Quatre mois" },
      { "week": 20, "targetWeight": <poids semaine 20>, "milestone": "Cinq mois" },
      { "week": 24, "targetWeight": <poids recommandé>, "milestone": "Objectif atteint" }
    ]
  },
  "nutrition": {
    "focus": ["Aliment/nutriment à privilégier (raison sang ou ADN)", "..."],
    "avoid": ["À limiter (raison)", "..."],
    "mealsGuidelines": ["Conseil repas 1", "Conseil repas 2", "..."],
    "hydration": "Conseil hydratation",
    "supplements": ["Supplément si nécessaire"]
  },
  "fitness": {
    "weeklyGoal": "Objectif semaine",
    "cardio": "Recommandation cardio",
    "strength": "Recommandation renforcement",
    "mobility": "Recommandation mobilité",
    "rest": "Recommandation repos",
    "plan": ["Conseil sport 1", "Conseil sport 2", "..."]
  },
  "behavior": {
    "sleep": ["Conseil sommeil 1", "..."],
    "stress": ["Conseil stress 1", "..."],
    "recovery": ["Conseil récupération 1", "..."],
    "mindfulness": ["Conseil bien-être 1", "..."],
    "other": ["Autre conseil 1", "..."]
  },
  "bloodInsights": ["Lien plan -> biomarqueur"],
  "dnaInsights": ["Lien plan -> variant ADN"],
  "synergies": ["Synergie sang+ADN"]
}

IMPORTANT pour dailyTodos:
- Génère 8-12 tâches quotidiennes concrètes et actionnables basées sur TOUTES les recommandations du plan
- Inclus des tâches pour: nutrition (repas, hydratation, suppléments), fitness (exercices du jour), behavior (sommeil, stress, mindfulness), weight (suivi régime, pesée si nécessaire), health (actions pour corriger problèmes identifiés dans analyses)
- Priorité "high" pour les actions critiques pour corriger les problèmes de santé identifiés
- Priorité "medium" pour les actions importantes du régime et fitness
- Priorité "low" pour les actions bonus/bien-être
- timeOfDay: "morning" pour actions matinales (suppléments, petit-déj, exercice), "afternoon" pour déjeuner/activité, "evening" pour dîner/sommeil, "anytime" pour actions flexibles
- Chaque tâche doit être spécifique, mesurable et directement liée aux recommandations du plan

IMPORTANT pour weightManagement:
- recommendedWeight: Calcule un poids idéal basé sur l'IMC sain (18.5-25), mais ajuste selon les biomarqueurs (ex: si cholestérol élevé, viser IMC 22-23), les prédispositions ADN (métabolisme), et conditions médicales
- weightProgression: Crée une courbe de progression réaliste et motivante sur 24 semaines (6 mois), avec perte/gain progressive de 0.3-0.8kg par semaine selon l'écart
- personalizedDiet: Régime ultra personnalisé selon analyses (ex: si glycémie élevée, réduire glucides; si inflammation, anti-inflammatoire)

Règles: ton simple, max 6 items par liste, liens clairs avec les données.`,
          },
        ],
        max_tokens: 3000,
        temperature: 0.4,
      })
    } catch (err: any) {
      console.error('OpenAI call failed:', err?.message || err)
      return NextResponse.json(
        { message: 'Erreur OpenAI: ' + (err?.message || 'inconnue') },
        { status: 502 }
      )
    }

    const rawContent = response.choices?.[0]?.message?.content
    const assistantMessage = Array.isArray(rawContent)
      ? rawContent.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('\n')
      : rawContent

    if (!assistantMessage || assistantMessage.trim() === '') {
      return NextResponse.json(
        { message: 'Pas de réponse de l\'IA' },
        { status: 500 }
      )
    }

    // Parse JSON response
    let planResult
    try {
      // response_format json_object garantit un JSON strict
      planResult = JSON.parse(assistantMessage)
    } catch (parseError) {
      console.error('Failed to parse AI response:', assistantMessage)
      return NextResponse.json(
        { message: 'Erreur lors du traitement de la réponse de l\'IA' },
        { status: 500 }
      )
    }

    // Sanitize minimal fields to avoid runtime issues
    const safeArray = (val: any) => (Array.isArray(val) ? val : [])
    const safeString = (val: any) => (typeof val === 'string' ? val : '')
    const safeNumber = (val: any) => (typeof val === 'number' && !isNaN(val) ? val : 0)

    const weightMgmt = planResult?.weightManagement
    const sanitized = {
      summary: safeString(planResult?.summary),
      dailyTodos: safeArray(planResult?.dailyTodos).map((todo: any, index: number) => ({
        id: safeString(todo.id) || `todo-${Date.now()}-${index}`,
        category: ['nutrition', 'fitness', 'behavior', 'weight', 'health'].includes(todo.category) 
          ? todo.category 
          : 'health',
        task: safeString(todo.task),
        priority: ['high', 'medium', 'low'].includes(todo.priority) 
          ? todo.priority 
          : 'medium',
        timeOfDay: ['morning', 'afternoon', 'evening', 'anytime'].includes(todo.timeOfDay)
          ? todo.timeOfDay
          : 'anytime',
        completed: false,
      })),
      weightManagement: weightMgmt ? {
        currentWeight: safeNumber(weightMgmt.currentWeight) || profile?.weight || 70,
        recommendedWeight: safeNumber(weightMgmt.recommendedWeight),
        reasoning: safeString(weightMgmt.reasoning),
        personalizedDiet: {
          dailyCalories: safeNumber(weightMgmt.personalizedDiet?.dailyCalories),
          macronutrients: {
            proteins: {
              grams: safeNumber(weightMgmt.personalizedDiet?.macronutrients?.proteins?.grams),
              percentage: safeNumber(weightMgmt.personalizedDiet?.macronutrients?.proteins?.percentage),
            },
            carbs: {
              grams: safeNumber(weightMgmt.personalizedDiet?.macronutrients?.carbs?.grams),
              percentage: safeNumber(weightMgmt.personalizedDiet?.macronutrients?.carbs?.percentage),
            },
            fats: {
              grams: safeNumber(weightMgmt.personalizedDiet?.macronutrients?.fats?.grams),
              percentage: safeNumber(weightMgmt.personalizedDiet?.macronutrients?.fats?.percentage),
            },
          },
          mealPlan: safeArray(weightMgmt.personalizedDiet?.mealPlan),
          keyPrinciples: safeArray(weightMgmt.personalizedDiet?.keyPrinciples),
        },
        weightProgression: safeArray(weightMgmt.weightProgression).map((wp: any) => ({
          week: safeNumber(wp.week),
          targetWeight: safeNumber(wp.targetWeight),
          milestone: safeString(wp.milestone),
        })),
      } : undefined,
      nutrition: {
        focus: safeArray(planResult?.nutrition?.focus),
        avoid: safeArray(planResult?.nutrition?.avoid),
        mealsGuidelines: safeArray(planResult?.nutrition?.mealsGuidelines),
        hydration: safeString(planResult?.nutrition?.hydration),
        supplements: safeArray(planResult?.nutrition?.supplements),
      },
      fitness: {
        weeklyGoal: safeString(planResult?.fitness?.weeklyGoal),
        cardio: safeString(planResult?.fitness?.cardio),
        strength: safeString(planResult?.fitness?.strength),
        mobility: safeString(planResult?.fitness?.mobility),
        rest: safeString(planResult?.fitness?.rest),
        plan: safeArray(planResult?.fitness?.plan),
      },
      behavior: {
        sleep: safeArray(planResult?.behavior?.sleep),
        stress: safeArray(planResult?.behavior?.stress),
        recovery: safeArray(planResult?.behavior?.recovery),
        mindfulness: safeArray(planResult?.behavior?.mindfulness),
        other: safeArray(planResult?.behavior?.other),
      },
      bloodInsights: safeArray(planResult?.bloodInsights),
      dnaInsights: safeArray(planResult?.dnaInsights),
      synergies: safeArray(planResult?.synergies),
    }

    return NextResponse.json(sanitized)
  } catch (error: any) {
    console.error('Plan generation error:', error?.message || error)
    const detail = error?.response?.data || error?.message
    
    if (error?.status === 401) {
      return NextResponse.json(
        { message: 'Clé API OpenAI invalide' },
        { status: 401 }
      )
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { message: 'Limite de requêtes OpenAI atteinte. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { message: detail || error.message || 'Erreur lors de la génération du plan' },
      { status: 500 }
    )
  }
}
