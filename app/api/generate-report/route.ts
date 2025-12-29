import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { bloodAnalysis, dnaAnalysis, profile, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ message: 'Clé API OpenAI requise' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    // Build patient context
    const patientName = `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'le patient'
    const patientInfo = profile ? `
- Nom: ${patientName}
- Âge: ${profile.age || 'non renseigné'} ans
- Sexe: ${profile.sex === 'male' ? 'Homme' : profile.sex === 'female' ? 'Femme' : 'non renseigné'}
- Taille: ${profile.height || 'non renseigné'} cm
- Poids: ${profile.weight || 'non renseigné'} kg
` : 'Informations patient non disponibles'

    // Blood analysis summary
    let bloodContext = ''
    let biomarkersData: any[] = []
    if (bloodAnalysis) {
      biomarkersData = bloodAnalysis.biomarkers.map((b: any) => ({
        name: b.name,
        value: b.value,
        unit: b.unit,
        reference: b.referenceRange,
        normalRange: b.normalRange,
        status: b.status,
        category: b.category
      }))

      const allBiomarkers = bloodAnalysis.biomarkers
        .map((b: any) => `- ${b.name}: ${b.value} ${b.unit} (référence: ${b.referenceRange}, statut: ${b.status === 'optimal' || b.status === 'normal' ? 'NORMAL' : 'À SURVEILLER'})`)
        .join('\n')

      bloodContext = `
ANALYSE SANGUINE (${new Date(bloodAnalysis.date).toLocaleDateString('fr-FR')}):
Score global: ${bloodAnalysis.overallScore}/100
Nombre de biomarqueurs analysés: ${bloodAnalysis.biomarkers.length}

DÉTAIL COMPLET DES BIOMARQUEURS AVEC RÉFÉRENCES:
${allBiomarkers}

Résumé original: ${bloodAnalysis.summary}
`
    }

    // DNA analysis summary
    let dnaContext = ''
    let snpsData: any[] = []
    if (dnaAnalysis) {
      dnaAnalysis.categories.forEach((c: any) => {
        c.snps.forEach((snp: any) => {
          snpsData.push({
            category: c.name,
            gene: snp.gene,
            rsid: snp.rsid,
            genotype: snp.genotype,
            impact: snp.impact,
            description: snp.description
          })
        })
      })

      const categorySummaries = dnaAnalysis.categories
        .map((c: any) => {
          const snpDetails = c.snps
            .map((s: any) => `  • ${s.gene} (${s.rsid}): génotype ${s.genotype} - impact ${s.impact === 'favorable' ? 'FAVORABLE' : s.impact === 'risk' ? 'À RISQUE' : 'NEUTRE'}${s.description ? ` - ${s.description}` : ''}`)
            .join('\n')
          return `${c.name} (score: ${c.score}/100):\n${snpDetails}`
        })
        .join('\n\n')

      dnaContext = `
ANALYSE GÉNÉTIQUE (${new Date(dnaAnalysis.date).toLocaleDateString('fr-FR')}):
Score global: ${dnaAnalysis.overallScore}/100
Source: ${dnaAnalysis.source}

DÉTAIL COMPLET DES VARIANTS GÉNÉTIQUES:
${categorySummaries}

Résumé original: ${dnaAnalysis.summary}

Prédispositions identifiées: ${dnaAnalysis.insights?.join('; ') || 'Aucune'}
`
    }

    const prompt = `Tu es un médecin biologiste rédigeant un rapport de santé personnalisé professionnel.
Rédige un rapport médical complet et détaillé pour ce patient, en utilisant EXCLUSIVEMENT la troisième personne.
Le rapport doit être écrit comme si tu présentais ce patient à un confrère médecin.

INFORMATIONS PATIENT:
${patientInfo}

${bloodContext}

${dnaContext}

CONSIGNES DE RÉDACTION:
1. TOUJOURS utiliser la troisième personne: "Le patient présente...", "On observe chez ${patientName}...", "Il/Elle montre..."
2. Adopter un ton médical professionnel mais accessible
3. Faire des liens entre les résultats sanguins et les prédispositions génétiques quand c'est pertinent
4. Structurer le rapport de manière logique
5. Inclure des recommandations concrètes et personnalisées
6. Ne JAMAIS tutoyer ou vouvoyer le patient

STRUCTURE DU RAPPORT (en JSON):
{
  "titre": "Rapport de Santé - [Nom du patient]",
  "dateRapport": "[date du jour]",
  "resumeExecutif": "Paragraphe de synthèse globale de l'état de santé du patient (3-4 phrases)",
  "profilPatient": {
    "description": "Description clinique du patient",
    "facteurs": ["Liste des facteurs de risque ou protecteurs identifiés"]
  },
  "analyseSanguine": {
    "interpretation": "Interprétation détaillée des résultats sanguins (2-3 paragraphes)",
    "biomarqueursDetails": [
      {
        "nom": "Nom du biomarqueur",
        "valeur": "valeur mesurée avec unité",
        "reference": "plage de référence",
        "interpretation": "Interprétation médicale de cette valeur spécifique pour ce patient",
        "statut": "normal" | "attention" | "critique"
      }
    ],
    "pointsAttention": ["Points nécessitant une surveillance avec valeurs"],
    "pointsPositifs": ["Éléments rassurants avec valeurs"]
  },
  "analyseGenetique": {
    "interpretation": "Interprétation du profil génétique et ses implications (2-3 paragraphes)",
    "variantsDetails": [
      {
        "gene": "Nom du gène",
        "variant": "rsID",
        "genotype": "génotype observé",
        "impact": "favorable" | "neutre" | "risque",
        "interpretation": "Ce que ce variant signifie pour ce patient"
      }
    ],
    "predispositions": ["Prédispositions identifiées avec leur impact"],
    "atouts": ["Avantages génétiques du patient"]
  },
  "syntheseCroisee": {
    "analyse": "Analyse croisant les données sanguines et génétiques (2-3 paragraphes)",
    "correlations": ["Corrélations identifiées entre marqueurs sanguins et variants génétiques"]
  },
  "recommandations": {
    "prioritaires": ["Actions prioritaires à mettre en place"],
    "nutrition": ["Conseils nutritionnels spécifiques avec justification"],
    "activitePhysique": ["Recommandations d'exercice adaptées au profil"],
    "suivi": ["Examens ou consultations recommandés avec fréquence"]
  },
  "conclusion": "Conclusion générale sur l'état de santé et les perspectives (2-3 phrases)"
}

IMPORTANT: Pour les biomarqueursDetails, inclure TOUS les biomarqueurs importants (au moins les 10 principaux), en précisant TOUJOURS la valeur exacte et la référence.
Pour les variantsDetails, inclure les variants les plus significatifs (5-10 principaux) avec leur interprétation.

Réponds UNIQUEMENT avec le JSON valide, sans markdown ni commentaires.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 6000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ message: 'Pas de réponse de l\'IA' }, { status: 502 })
    }

    const report = JSON.parse(content)
    
    // Ajouter les données brutes pour référence
    return NextResponse.json({
      ...report,
      _rawData: {
        biomarkers: biomarkersData,
        snps: snpsData,
        bloodScore: bloodAnalysis?.overallScore,
        dnaScore: dnaAnalysis?.overallScore,
        patientName,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Erreur génération rapport:', error)
    return NextResponse.json(
      { message: error.message || 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}
