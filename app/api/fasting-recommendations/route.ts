import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface Biomarker {
  name: string
  value: number
  unit: string
  status: string
}

interface DNACategory {
  name: string
  summary: string
}

export async function POST(request: NextRequest) {
  try {
    const { profile, bloodAnalysis, dnaAnalysis } = await request.json()

    if (!profile?.openaiKey) {
      return NextResponse.json(
        { error: 'Clé API OpenAI requise' },
        { status: 400 }
      )
    }

    if (!bloodAnalysis || !dnaAnalysis) {
      return NextResponse.json(
        { error: 'Analyses sanguines et ADN requises' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: profile.openaiKey,
    })

    // Construire le prompt avec les informations pertinentes
    const bloodMarkers = bloodAnalysis.biomarkers
      .map((b: Biomarker) => `${b.name}: ${b.value} ${b.unit} (${b.status})`)
      .join('\n')

    const dnaInsights = dnaAnalysis.categories
      .map((c: DNACategory) => `${c.name}: ${c.summary}`)
      .join('\n')

    const prompt = `Tu es un expert en jeûne intermittent et en médecine personnalisée. 
Analyse les données suivantes et génère des recommandations ultra-personnalisées pour un jeûne intermittent 16/8.

PROFIL UTILISATEUR:
- Âge: ${profile.age} ans
- Sexe: ${profile.sex}
- Poids: ${profile.weight} kg
- Taille: ${profile.height} cm
- Niveau d'activité: ${profile.sedentaryLevel}
- Conditions médicales: ${profile.medicalConditions || 'Aucune'}

ANALYSES SANGUINES:
${bloodMarkers}

PROFIL GÉNÉTIQUE:
${dnaInsights}

RECOMMANDATIONS À GÉNÉRER:
1. Heure optimale de début du jeûne (en fonction du rythme circadien, du métabolisme, et des analyses)
2. Durée recommandée (peut être ajustée entre 14-18h selon le profil)
3. Avertissements spécifiques (basés sur les biomarqueurs à risque, conditions médicales, prédispositions génétiques)
4. Bénéfices attendus pour cette personne spécifique (basés sur les analyses)
5. Adaptations recommandées (ex: si glycémie basse, si problèmes hépatiques, si prédispositions génétiques spécifiques)

IMPORTANT:
- Sois très précis et personnalisé
- Prends en compte les risques identifiés dans les analyses
- Adapte la durée et les recommandations selon le profil métabolique
- Mentionne les interactions possibles avec les conditions médicales
- Propose des adaptations basées sur les prédispositions génétiques

Réponds UNIQUEMENT avec un JSON valide au format suivant (sans markdown, sans code blocks):
{
  "optimalStartTime": "HH:MM (ex: 20:00)",
  "duration": 16,
  "warnings": ["avertissement 1", "avertissement 2"],
  "benefits": ["bénéfice 1", "bénéfice 2", "bénéfice 3"],
  "adaptations": ["adaptation 1", "adaptation 2", "adaptation 3"]
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en jeûne intermittent et médecine personnalisée. Tu génères des recommandations précises et personnalisées basées sur des analyses médicales.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('Réponse vide de l\'API OpenAI')
    }

    let recommendations
    try {
      recommendations = JSON.parse(responseText)
    } catch (e) {
      // Essayer d'extraire le JSON si la réponse contient du markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Impossible de parser la réponse JSON')
      }
    }

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    console.error('Erreur lors de la génération des recommandations de jeûne:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération des recommandations' },
      { status: 500 }
    )
  }
}

