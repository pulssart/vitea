import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { bloodAnalysis, dnaAnalysis, profile, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ message: 'Clé API OpenAI requise' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    // Construire le contexte pour la synthèse
    const patientName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Le patient'
    
    let context = `Tu es un médecin qui rédige un rapport de santé professionnel et clair.
    
Patient: ${patientName}
Âge: ${profile?.age || 'N/A'} ans
Sexe: ${profile?.sex === 'male' ? 'Homme' : profile?.sex === 'female' ? 'Femme' : 'N/A'}
${profile?.medicalConditions ? `Conditions médicales particulières: ${profile.medicalConditions}` : ''}

`

    if (bloodAnalysis) {
      context += `=== ANALYSE SANGUINE ===
Score global: ${bloodAnalysis.overallScore}/100
Date: ${new Date(bloodAnalysis.date).toLocaleDateString('fr-FR')}

Biomarqueurs (${bloodAnalysis.biomarkers?.length || 0} analysés):
${bloodAnalysis.biomarkers?.slice(0, 15).map((b: any) => `- ${b.name}: ${b.value} ${b.unit} (${b.status})`).join('\n')}
${bloodAnalysis.biomarkers?.length > 15 ? `... et ${bloodAnalysis.biomarkers.length - 15} autres` : ''}

Résumé original: ${bloodAnalysis.summary}

`
    }

    if (dnaAnalysis) {
      context += `=== ANALYSE ADN ===
Score global: ${dnaAnalysis.overallScore}/100
Date: ${new Date(dnaAnalysis.date).toLocaleDateString('fr-FR')}

Catégories génétiques:
${dnaAnalysis.categories?.map((c: any) => `- ${c.name}: ${c.score}/100 (${c.snps?.length || 0} variants)`).join('\n')}

Résumé original: ${dnaAnalysis.summary}

`
    }

    const prompt = `${context}

Génère une synthèse professionnelle et DÉTAILLÉE pour un rapport médical imprimé. Le texte doit:
- Parler du patient à la 3ème personne (il/elle, son/sa)
- Être clair, professionnel et complet
- Détailler les résultats importants avec des valeurs spécifiques
- Expliquer les implications pour la santé
- Mentionner les points positifs ET les points à surveiller
- Être adapté pour un document officiel médical

Réponds en JSON avec cette structure exacte:
{
  "bloodSynthesis": "Synthèse DÉTAILLÉE de 5-7 phrases sur l'analyse sanguine. Inclure: état général, biomarqueurs clés avec leurs valeurs, ce qui est normal, ce qui nécessite attention, et implications pour la santé.",
  "dnaSynthesis": "Synthèse DÉTAILLÉE de 5-7 phrases sur l'analyse génétique. Inclure: vue d'ensemble du profil, prédispositions favorables, variants à risque identifiés, catégories importantes, et ce que cela signifie pour le patient.", 
  "globalSynthesis": "Synthèse globale de 3-4 phrases combinant les deux analyses et leurs interactions.",
  "keyPoints": ["Point clé détaillé 1", "Point clé détaillé 2", "Point clé détaillé 3", "Point clé détaillé 4", "Point clé détaillé 5", "Point clé détaillé 6"]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ message: 'Pas de réponse de l\'IA' }, { status: 502 })
    }

    const synthesis = JSON.parse(content)
    return NextResponse.json(synthesis)

  } catch (error: any) {
    console.error('Erreur synthèse rapport:', error)
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la synthèse' },
      { status: 500 }
    )
  }
}
