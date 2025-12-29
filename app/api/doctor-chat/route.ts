import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { message, history, bloodAnalysis, dnaAnalysis, healthPlan, profile, apiKey, stream } = await request.json()

    if (!message) {
      return NextResponse.json(
        { message: 'Message requis' },
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
    
    // Si streaming demandé, utiliser SSE
    if (stream) {
      return handleStreaming(openai, message, history, bloodAnalysis, dnaAnalysis, healthPlan, profile)
    }

    // Construire le contexte complet
    let context = `Tu es un médecin AI bienveillant et pédagogue. Tu as accès aux données de santé complètes de l'utilisateur et tu réponds à ses questions de manière claire, rassurante et personnalisée.

RÈGLES IMPORTANTES:
- Réponds toujours en français
- Sois pédagogue, explique les termes médicaux simplement
- Sois rassurant mais honnête
- Base tes réponses sur les données fournies
- Si tu ne sais pas, dis-le
- Rappelle que tu ne remplaces pas un vrai médecin pour les décisions importantes
- Utilise des emojis avec parcimonie pour rendre la conversation plus chaleureuse

`

    // Ajouter le profil
    if (profile) {
      context += `
=== PROFIL DE L'UTILISATEUR ===
- Prénom: ${profile.firstName}
- Sexe: ${profile.sex === 'male' ? 'Homme' : profile.sex === 'female' ? 'Femme' : 'Autre'}
- Âge: ${profile.age} ans
- Poids: ${profile.weight} kg
- Taille: ${profile.height} cm
- IMC: ${(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
- Niveau d'activité: ${profile.sedentaryLevel}
${profile.medicalConditions ? `- CONDITIONS MÉDICALES PARTICULIÈRES: ${profile.medicalConditions}` : ''}

`
    }

    // Ajouter l'analyse de sang
    if (bloodAnalysis) {
      const biomarkers = bloodAnalysis.biomarkers || []
      context += `
=== ANALYSE DE SANG (${new Date(bloodAnalysis.date).toLocaleDateString('fr-FR')}) ===
Score global: ${bloodAnalysis.overallScore}/100

Biomarqueurs:
${biomarkers.map((b: any) => 
  `- ${b.name}: ${b.value} ${b.unit} (${b.status}) [Réf: ${b.normalRange.min}-${b.normalRange.max}]`
).join('\n')}

Résumé: ${bloodAnalysis.summary}

Points clés:
${(bloodAnalysis.insights || []).map((i: string) => `- ${i}`).join('\n')}

`
    }

    // Ajouter l'analyse ADN
    if (dnaAnalysis) {
      context += `
=== ANALYSE ADN ===
Score global: ${dnaAnalysis.overallScore}/100
Source: ${dnaAnalysis.source}

Catégories:
${(dnaAnalysis.categories || []).map((c: any) => {
  const snps = (c.snps || []).slice(0, 5)
  return `- ${c.name} (${c.status}, score ${c.score}/100): ${snps.map((s: any) => `${s.gene} ${s.genotype} (${s.impact})`).join(', ')}`
}).join('\n')}

Résumé: ${dnaAnalysis.summary}

Points clés:
${(dnaAnalysis.insights || []).map((i: string) => `- ${i}`).join('\n')}

`
    }

    // Ajouter le plan de santé
    if (healthPlan) {
      context += `
=== PLAN DE SANTÉ PERSONNALISÉ ===
${healthPlan.summary || ''}

Nutrition:
- Focus: ${(healthPlan.nutrition?.focus || []).join(', ')}
- À éviter: ${(healthPlan.nutrition?.avoid || []).join(', ')}
- Hydratation: ${healthPlan.nutrition?.hydration || ''}
- Suppléments: ${(healthPlan.nutrition?.supplements || []).join(', ')}

Fitness:
- Objectif: ${healthPlan.fitness?.weeklyGoal || ''}
- Cardio: ${healthPlan.fitness?.cardio || ''}
- Renforcement: ${healthPlan.fitness?.strength || ''}

Comportement:
- Sommeil: ${(healthPlan.behavior?.sleep || []).join(', ')}
- Stress: ${(healthPlan.behavior?.stress || []).join(', ')}

Synergies sang+ADN:
${(healthPlan.synergies || []).map((s: string) => `- ${s}`).join('\n')}

`
    }

    // Construire les messages pour l'API
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: context },
    ]

    // Ajouter l'historique de conversation
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // Garder les 10 derniers messages
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })
      }
    }

    // Ajouter le nouveau message
    messages.push({ role: 'user', content: message })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1500,
      temperature: 0.7,
    })

    const assistantMessage = response.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { message: 'Pas de réponse de l\'IA' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response: assistantMessage })
  } catch (error: any) {
    console.error('Doctor chat error:', error)
    
    if (error?.status === 401) {
      return NextResponse.json(
        { message: 'Clé API OpenAI invalide' },
        { status: 401 }
      )
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { message: 'Limite de requêtes atteinte. Réessayez plus tard.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { message: error.message || 'Erreur lors de la communication avec le docteur AI' },
      { status: 500 }
    )
  }
}

async function handleStreaming(
  openai: OpenAI,
  message: string,
  history: Message[],
  bloodAnalysis: any,
  dnaAnalysis: any,
  healthPlan: any,
  profile: any
) {
  // Construire le contexte (même logique que dans POST)
  let context = `Tu es un médecin AI bienveillant et pédagogue. Tu as accès aux données de santé complètes de l'utilisateur et tu réponds à ses questions de manière claire, rassurante et personnalisée.

RÈGLES IMPORTANTES:
- Réponds toujours en français
- Sois pédagogue, explique les termes médicaux simplement
- Sois rassurant mais honnête
- Base tes réponses sur les données fournies
- Si tu ne sais pas, dis-le
- Rappelle que tu ne remplaces pas un vrai médecin pour les décisions importantes
- Utilise des emojis avec parcimonie pour rendre la conversation plus chaleureuse

`

  if (profile) {
    context += `
=== PROFIL DE L'UTILISATEUR ===
- Prénom: ${profile.firstName}
- Sexe: ${profile.sex === 'male' ? 'Homme' : profile.sex === 'female' ? 'Femme' : 'Autre'}
- Âge: ${profile.age} ans
- Poids: ${profile.weight} kg
- Taille: ${profile.height} cm
- IMC: ${(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
- Niveau d'activité: ${profile.sedentaryLevel}
${profile.medicalConditions ? `- CONDITIONS MÉDICALES PARTICULIÈRES: ${profile.medicalConditions}` : ''}

`
  }

  if (bloodAnalysis) {
    const biomarkers = bloodAnalysis.biomarkers || []
    context += `
=== ANALYSE DE SANG (${new Date(bloodAnalysis.date).toLocaleDateString('fr-FR')}) ===
Score global: ${bloodAnalysis.overallScore}/100

Biomarqueurs:
${biomarkers.map((b: any) => 
  `- ${b.name}: ${b.value} ${b.unit} (${b.status}) [Réf: ${b.normalRange.min}-${b.normalRange.max}]`
).join('\n')}

Résumé: ${bloodAnalysis.summary}

Points clés:
${(bloodAnalysis.insights || []).map((i: string) => `- ${i}`).join('\n')}

`
  }

  if (dnaAnalysis) {
    context += `
=== ANALYSE ADN ===
Score global: ${dnaAnalysis.overallScore}/100
Source: ${dnaAnalysis.source}

Catégories:
${(dnaAnalysis.categories || []).map((c: any) => {
  const snps = (c.snps || []).slice(0, 5)
  return `- ${c.name} (${c.status}, score ${c.score}/100): ${snps.map((s: any) => `${s.gene} ${s.genotype} (${s.impact})`).join(', ')}`
}).join('\n')}

Résumé: ${dnaAnalysis.summary}

Points clés:
${(dnaAnalysis.insights || []).map((i: string) => `- ${i}`).join('\n')}

`
  }

  if (healthPlan) {
    context += `
=== PLAN DE SANTÉ PERSONNALISÉ ===
${healthPlan.summary || ''}

Nutrition:
- Focus: ${(healthPlan.nutrition?.focus || []).join(', ')}
- À éviter: ${(healthPlan.nutrition?.avoid || []).join(', ')}
- Hydratation: ${healthPlan.nutrition?.hydration || ''}
- Suppléments: ${(healthPlan.nutrition?.supplements || []).join(', ')}

Fitness:
- Objectif: ${healthPlan.fitness?.weeklyGoal || ''}
- Cardio: ${healthPlan.fitness?.cardio || ''}
- Renforcement: ${healthPlan.fitness?.strength || ''}

Comportement:
- Sommeil: ${(healthPlan.behavior?.sleep || []).join(', ')}
- Stress: ${(healthPlan.behavior?.stress || []).join(', ')}

Synergies sang+ADN:
${(healthPlan.synergies || []).map((s: string) => `- ${s}`).join('\n')}

`
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: context },
  ]

  if (history && Array.isArray(history)) {
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }
  }

  messages.push({ role: 'user', content: message })

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            const data = JSON.stringify({ content })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
