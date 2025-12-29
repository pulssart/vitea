import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface RecommendedAnalysis {
  id: string
  name: string
  description: string
  frequency: string
  priority: 'high' | 'medium' | 'low'
  category: string
  completed: boolean
  includes?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { profile, analyses, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json(
        { message: 'Clé API OpenAI requise' },
        { status: 400 }
      )
    }

    if (!profile) {
      return NextResponse.json(
        { message: 'Profil utilisateur requis' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Construire le contexte
    const age = profile.age || 30
    const sex = profile.sex === 'male' ? 'homme' : profile.sex === 'female' ? 'femme' : 'autre'
    const medicalConditions = profile.medicalConditions || 'Aucune condition médicale particulière'
    const latestAnalysis = analyses?.[0]
    
    let context = `Tu es un médecin qui recommande des analyses médicales personnalisées.

PROFIL PATIENT:
- Âge: ${age} ans
- Sexe: ${sex}
- Conditions médicales: ${medicalConditions}
`

    if (latestAnalysis) {
      const biomarkersAttention = latestAnalysis.biomarkers
        .filter((b: any) => b.status === 'attention')
        .map((b: any) => `${b.name}: ${b.value} ${b.unit}`)
        .join(', ')
      
      context += `
ANALYSE SANGUINE RÉCENTE:
- Date: ${new Date(latestAnalysis.date).toLocaleDateString('fr-FR')}
- Score global: ${latestAnalysis.overallScore}/100
- Biomarqueurs à surveiller: ${biomarkersAttention || 'Aucun'}
`
    }

    const prompt = `${context}

Génère une liste personnalisée d'analyses médicales recommandées pour ce patient en fonction de:
1. Son âge (${age} ans)
2. Son sexe (${sex})
3. Ses conditions médicales (${medicalConditions})
${latestAnalysis ? '4. Ses résultats d\'analyse récente avec les biomarqueurs à surveiller' : ''}

IMPORTANT: Si plusieurs analyses peuvent être combinées en une seule prise de sang ou un seul examen, regroupe-les en une seule analyse.

Réponds UNIQUEMENT avec un JSON valide de cette structure:
{
  "analyses": [
    {
      "name": "Nom de l'analyse combinée (ex: Bilan de santé complet, Bilan lipidique + glycémie, etc.)",
      "description": "Description courte de pourquoi cette analyse est recommandée et quelles analyses elle combine",
      "frequency": "Fréquence recommandée (ex: Tous les 6 mois, Annuel, Une fois)",
      "priority": "high" | "medium" | "low",
      "category": "sang" | "urine" | "imagerie" | "autre",
      "includes": ["Liste des analyses individuelles incluses dans cette analyse combinée"]
    }
  ]
}

Règles:
- REGROUPE les analyses qui peuvent être faites ensemble (ex: toutes les analyses de sang en un seul "Bilan de santé complet")
- Si plusieurs analyses de sang sont nécessaires, crée UNE SEULE analyse "Bilan de sang complet" qui les combine
- Recommande 5-8 analyses combinées maximum (pas d'analyses individuelles si elles peuvent être regroupées)
- Priorité "high" pour les analyses critiques selon l'âge et les conditions
- Priorité "medium" pour les analyses de suivi recommandées
- Priorité "low" pour les analyses préventives optionnelles
- Adapte les recommandations à l'âge (ex: dépistage cancer après 50 ans)
- Si des biomarqueurs sont à surveiller, recommande des analyses de suivi spécifiques
- Le champ "includes" doit lister les analyses individuelles qui sont combinées (ex: ["Glycémie", "Cholestérol total", "HDL", "LDL", "Triglycérides"])

Exemples de regroupement:
- "Bilan de santé complet" qui combine: Glycémie, Cholestérol, Triglycérides, Numération formule sanguine, etc.
- "Bilan hépatique" qui combine: Transaminases, Bilirubine, etc.
- "Bilan rénal" qui combine: Créatinine, Urée, etc.

Réponds UNIQUEMENT avec le JSON, sans markdown ni commentaires.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { message: 'Pas de réponse de l\'IA' },
        { status: 500 }
      )
    }

    const data = JSON.parse(content)
    
    // Ajouter des IDs et le statut completed
    const recommendedAnalyses: RecommendedAnalysis[] = (data.analyses || []).map((analysis: any, index: number) => ({
      id: `analysis-${Date.now()}-${index}`,
      name: analysis.name,
      description: analysis.description,
      frequency: analysis.frequency,
      priority: analysis.priority || 'medium',
      category: analysis.category || 'sang',
      completed: false,
      includes: analysis.includes || [],
    }))

    return NextResponse.json({ analyses: recommendedAnalyses })
  } catch (error: any) {
    console.error('Erreur génération analyses recommandées:', error)
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la génération des analyses recommandées' },
      { status: 500 }
    )
  }
}

