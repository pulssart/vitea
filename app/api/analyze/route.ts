import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface FileData {
  name: string
  type: string
  data: string // base64
}

interface ProfileData {
  firstName: string
  lastName: string
  age: number
  weight: number
  height: number
  sedentaryLevel: string
}

const SEDENTARY_LABELS: Record<string, string> = {
  sedentary: 'sédentaire',
  light: 'légèrement actif',
  moderate: 'modérément actif',
  active: 'actif',
  very_active: 'très actif',
}

export async function POST(request: NextRequest) {
  try {
    const { files, profile, apiKey } = await request.json()

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'Aucun fichier fourni' },
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

    // Build the profile context
    const sexLabels: Record<string, string> = {
      male: 'Homme',
      female: 'Femme',
      other: 'Autre',
    }
    const profileContext = profile
      ? `
Profil du patient:
- Nom: ${profile.firstName} ${profile.lastName}
- Sexe: ${sexLabels[profile.sex] || 'Non précisé'}
- Âge: ${profile.age} ans
- Poids: ${profile.weight} kg
- Taille: ${profile.height} cm
- IMC: ${(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
- Niveau d'activité: ${SEDENTARY_LABELS[profile.sedentaryLevel] || profile.sedentaryLevel}
${profile.medicalConditions ? `- Conditions médicales particulières: ${profile.medicalConditions}` : ''}
`
      : ''

    // Prepare the content for OpenAI
    const content: OpenAI.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: `Tu es un expert médical bienveillant qui explique les résultats de prises de sang de manière claire et accessible. Ton objectif est que même un adolescent puisse comprendre ses résultats.

${profileContext}

⚠️ RÈGLE CRITIQUE - EXTRACTION EXHAUSTIVE ⚠️
Tu DOIS extraire ABSOLUMENT TOUS les biomarqueurs présents dans le document, sans exception !
Une prise de sang standard contient généralement 20 à 50+ biomarqueurs. Extrais-les TOUS :

Exemples de biomarqueurs à extraire (liste non exhaustive) :
- Hématologie : Hémoglobine, Hématocrite, Globules rouges, Globules blancs, Plaquettes, VGM, TCMH, CCMH, IDR, Neutrophiles, Lymphocytes, Monocytes, Éosinophiles, Basophiles
- Lipides : Cholestérol total, HDL, LDL, Triglycérides, Rapport CT/HDL
- Glycémie : Glucose à jeun, HbA1c
- Fonction hépatique : ASAT (GOT), ALAT (GPT), GGT, Phosphatases alcalines, Bilirubine totale, Bilirubine directe
- Fonction rénale : Créatinine, Urée, Acide urique, DFG (clairance)
- Électrolytes : Sodium, Potassium, Chlore, Calcium, Magnésium, Phosphore
- Protéines : Protéines totales, Albumine, CRP, Ferritine
- Fer : Fer sérique, Transferrine, Coefficient de saturation
- Thyroïde : TSH, T3, T4
- Vitamines : Vitamine D, Vitamine B12, Folates
- Autres : PSA, etc.

NE SAUTE AUCUNE VALEUR visible sur le document !

IMPORTANT: Tu dois répondre UNIQUEMENT en JSON valide avec la structure suivante, sans aucun texte avant ou après:

{
  "biomarkers": [
    {
      "name": "Nom du biomarqueur",
      "value": 123.45,
      "unit": "unité",
      "normalRange": { "min": 100, "max": 150 },
      "status": "optimal" | "standard" | "attention",
      "category": "Catégorie (ex: Hématologie, Lipides, Vitamines, etc.)",
      "description": "Explication simple et courte du rôle de ce biomarqueur (ex: 'Mesure le sucre dans ton sang')",
      "recommendation": "Action concrète et simple si le statut n'est pas optimal (ex: 'Mange plus de légumes verts'), null si optimal"
    }
  ],
  "summary": "RÉSUMÉ DÉTAILLÉ ET PÉDAGOGIQUE (voir instructions ci-dessous)",
  "insights": [
    "Point clé 1 - observation importante",
    "Point clé 2 - observation importante", 
    "Point clé 3 - observation importante",
    "Point clé 4 - observation importante",
    "Point clé 5 - observation importante"
  ],
  "recommendations": [
    "Action concrète 1 avec explication",
    "Action concrète 2 avec explication",
    "Action concrète 3 avec explication",
    "Action concrète 4 avec explication"
  ],
  "overallScore": 75
}

=== INSTRUCTIONS POUR LE RÉSUMÉ (TRÈS IMPORTANT) ===

Le résumé doit être DÉTAILLÉ (minimum 150 mots) et structuré en 3 parties :

1. **État général** (2-3 phrases)
   - Commence par une phrase positive et rassurante
   - Donne une vue d'ensemble claire de l'état de santé
   - Utilise des mots simples, évite le jargon médical

2. **Ce qui va bien** (2-3 phrases)
   - Liste les points positifs de l'analyse
   - Explique pourquoi c'est une bonne nouvelle
   - Encourage à continuer les bonnes habitudes

3. **Ce qui nécessite attention** (3-4 phrases)
   - Explique clairement chaque problème détecté EN LANGAGE SIMPLE
   - Pour chaque problème, explique : QUOI (le biomarqueur), POURQUOI c'est important, et COMMENT y remédier
   - Donne des exemples concrets d'aliments, activités ou habitudes à adopter
   - Rassure en expliquant que ces problèmes sont généralement faciles à corriger

Exemple de ton à utiliser : "Ta glycémie est un peu élevée, ce qui veut dire qu'il y a trop de sucre dans ton sang. Pas de panique ! En réduisant les sodas et les bonbons, et en marchant 30 minutes par jour, tu peux facilement améliorer ça."

=== INSTRUCTIONS POUR LES INSIGHTS ===
- Chaque insight doit être une phrase complète et informative
- Commence par le constat, puis donne le contexte
- Exemple : "Ton cholestérol HDL (le 'bon' cholestérol) est excellent, ce qui protège ton cœur"

=== INSTRUCTIONS POUR LES RECOMMENDATIONS ===
- Chaque recommandation doit être ACTIONNABLE et CONCRÈTE
- Format : "Action + Fréquence + Bénéfice"
- Exemple : "Mange du poisson gras (saumon, maquereau) 2 fois par semaine pour améliorer tes oméga-3 et protéger ton cœur"
- Priorise les recommandations par impact (les plus importantes en premier)

=== RÈGLES GÉNÉRALES ===
- Status "optimal": valeur dans la plage idéale
- Status "standard": valeur normale mais pourrait être meilleure
- Status "attention": valeur en dehors de la plage normale, nécessite une action

- Score 90-100: Excellent ! Continue comme ça
- Score 70-89: Bon état général, quelques ajustements possibles
- Score 50-69: Des améliorations nécessaires mais rien de grave
- Score 0-49: Consulte un médecin pour un suivi personnalisé

Personnalise TOUT en fonction du profil (âge ${profile?.age || 'inconnu'} ans, niveau d'activité ${SEDENTARY_LABELS[profile?.sedentaryLevel] || 'inconnu'}).

=== VÉRIFICATION FINALE ===
Avant de répondre, relis le document et vérifie que tu as bien extrait CHAQUE ligne de résultat.
Si tu vois 30 valeurs sur le document, tu dois avoir 30 biomarqueurs dans ta réponse.
Compte les biomarqueurs et assure-toi de n'en avoir oublié aucun !
`,
      },
    ]

    // Add all files as images or process PDFs
    for (const file of files as FileData[]) {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll add a note asking to analyze the text content
        // In a production app, you'd want to extract text from PDF first
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.data}`,
            detail: 'high',
          },
        })
      } else {
        // For images
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${file.data}`,
            detail: 'high',
          },
        })
      }
    }

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      max_completion_tokens: 8000,
      temperature: 0.3,
    })

    const assistantMessage = response.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { message: 'Pas de réponse de l\'IA' },
        { status: 500 }
      )
    }

    // Parse the JSON response
    let analysisResult
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', assistantMessage)
      return NextResponse.json(
        { message: 'Erreur lors du traitement de la réponse de l\'IA' },
        { status: 500 }
      )
    }

    // Validate and sanitize the response
    const validatedResult = {
      biomarkers: Array.isArray(analysisResult.biomarkers)
        ? analysisResult.biomarkers.map((b: any) => ({
            name: String(b.name || 'Inconnu'),
            value: Number(b.value) || 0,
            unit: String(b.unit || ''),
            normalRange: {
              min: Number(b.normalRange?.min) || 0,
              max: Number(b.normalRange?.max) || 100,
            },
            status: ['optimal', 'standard', 'attention'].includes(b.status)
              ? b.status
              : 'standard',
            category: String(b.category || 'Autre'),
            description: b.description ? String(b.description) : undefined,
            recommendation: b.recommendation ? String(b.recommendation) : undefined,
          }))
        : [],
      summary: String(analysisResult.summary || 'Analyse complétée'),
      insights: Array.isArray(analysisResult.insights)
        ? analysisResult.insights.map(String)
        : [],
      recommendations: Array.isArray(analysisResult.recommendations)
        ? analysisResult.recommendations.map(String)
        : [],
      overallScore: Math.min(100, Math.max(0, Number(analysisResult.overallScore) || 50)),
    }

    // Second pass: GPT-4o as judge to limit hallucinations / faux biomarqueurs
    try {
      const judgePrompt = `Tu es un auditeur qualité. On te fournit une liste de biomarqueurs extraits d'une prise de sang. Ta mission est de détecter et retirer toute entrée manifestement inventée ou non pertinente pour une analyse sanguine standard.

Retourne STRICTEMENT un JSON valide au format:
{
  "biomarkersApproved": [
    { "name": "...", "value": 0, "unit": "...", "normalRange": { "min": 0, "max": 0 }, "status": "optimal|standard|attention", "category": "...", "description": "...", "recommendation": "..." }
  ],
  "biomarkersRemoved": ["nom1", "nom2"],
  "note": "Brève note sur ce qui a été retiré"
}

Règles:
- Supprime tout marqueur qui n'est pas un paramètre biologique courant.
- Supprime les doublons exacts par nom.
- Ne modifie pas les valeurs ou unités, seulement filtre les entrées.

Liste à vérifier:
${validatedResult.biomarkers.map((b) => `- ${b.name} : ${b.value} ${b.unit} (ref ${b.normalRange.min}-${b.normalRange.max}) [${b.status}]`).join('\n')}`

      const judgeResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'user', content: judgePrompt },
        ],
        max_completion_tokens: 1500,
        temperature: 0,
      })

      const judgeContent = judgeResponse.choices?.[0]?.message?.content
      if (judgeContent) {
        const judgeParsed = JSON.parse(judgeContent)
        if (Array.isArray(judgeParsed?.biomarkersApproved) && judgeParsed.biomarkersApproved.length > 0) {
          validatedResult.biomarkers = judgeParsed.biomarkersApproved.map((b: any) => ({
            name: String(b.name || 'Inconnu'),
            value: Number(b.value) || 0,
            unit: String(b.unit || ''),
            normalRange: {
              min: Number(b.normalRange?.min) || 0,
              max: Number(b.normalRange?.max) || 100,
            },
            status: ['optimal', 'standard', 'attention'].includes(b.status)
              ? b.status
              : 'standard',
            category: String(b.category || 'Autre'),
            description: b.description ? String(b.description) : undefined,
            recommendation: b.recommendation ? String(b.recommendation) : undefined,
          }))
        }
      }
    } catch (judgeError) {
      console.warn('Judge step failed, using initial validatedResult:', judgeError)
    }

    return NextResponse.json(validatedResult)
  } catch (error: any) {
    console.error('Analysis error:', error)
    
    // Handle specific OpenAI errors
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

    if (error?.status === 400 && error?.message?.includes('Could not process image')) {
      return NextResponse.json(
        { message: 'Impossible de traiter l\'image. Vérifiez que le fichier est lisible.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}

