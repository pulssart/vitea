import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface ProfileData {
  firstName: string
  lastName: string
  age: number
  weight: number
  height: number
  sedentaryLevel: string
}

// Known health-related SNPs database (subset for prompt context)
const HEALTH_SNPS = {
  // Cardiovascular
  rs1333049: { gene: 'CDKN2B-AS1', trait: 'Risque cardiovasculaire', category: 'cardiovascular' },
  rs10757274: { gene: '9p21', trait: 'Risque coronarien', category: 'cardiovascular' },
  rs1801133: { gene: 'MTHFR', trait: 'Métabolisme folates (C677T)', category: 'cardiovascular' },
  
  // Metabolism
  rs9939609: { gene: 'FTO', trait: 'Prédisposition obésité', category: 'metabolism' },
  rs1801282: { gene: 'PPARG', trait: 'Sensibilité insuline', category: 'metabolism' },
  rs5219: { gene: 'KCNJ11', trait: 'Risque diabète type 2', category: 'metabolism' },
  rs7903146: { gene: 'TCF7L2', trait: 'Risque diabète type 2', category: 'metabolism' },
  
  // Nutrition
  rs4988235: { gene: 'MCM6/LCT', trait: 'Tolérance lactose', category: 'nutrition' },
  rs1695: { gene: 'GSTP1', trait: 'Détoxification', category: 'nutrition' },
  rs762551: { gene: 'CYP1A2', trait: 'Métabolisme caféine', category: 'nutrition' },
  rs1800497: { gene: 'ANKK1/DRD2', trait: 'Réponse dopamine', category: 'nutrition' },
  rs1799945: { gene: 'HFE', trait: 'Absorption fer (H63D)', category: 'nutrition' },
  rs1800562: { gene: 'HFE', trait: 'Hémochromatose (C282Y)', category: 'nutrition' },
  
  // Vitamins
  rs12785878: { gene: 'DHCR7', trait: 'Vitamine D', category: 'vitamins' },
  rs2282679: { gene: 'GC', trait: 'Transport vitamine D', category: 'vitamins' },
  rs602662: { gene: 'FUT2', trait: 'Absorption vitamine B12', category: 'vitamins' },
  
  // Fitness
  rs1815739: { gene: 'ACTN3', trait: 'Type fibres musculaires', category: 'fitness' },
  rs4253778: { gene: 'PPARA', trait: 'Endurance', category: 'fitness' },
  rs1042713: { gene: 'ADRB2', trait: 'Performance aérobie', category: 'fitness' },
  rs8192678: { gene: 'PPARGC1A', trait: 'Capacité aérobie', category: 'fitness' },
  
  // Pharmacogenomics
  rs1799853: { gene: 'CYP2C9', trait: 'Métabolisme warfarine', category: 'pharmacogenomics' },
  rs1057910: { gene: 'CYP2C9', trait: 'Métabolisme médicaments', category: 'pharmacogenomics' },
  rs4244285: { gene: 'CYP2C19', trait: 'Métabolisme clopidogrel', category: 'pharmacogenomics' },
  rs1128503: { gene: 'ABCB1', trait: 'Transport médicaments', category: 'pharmacogenomics' },
  
  // Sleep & Circadian
  rs57875989: { gene: 'DEC2', trait: 'Besoin sommeil', category: 'sleep' },
  rs1801260: { gene: 'CLOCK', trait: 'Rythme circadien', category: 'sleep' },
  
  // Immune & Inflammation
  rs1800795: { gene: 'IL6', trait: 'Inflammation', category: 'immune' },
  rs1800629: { gene: 'TNF', trait: 'Réponse immunitaire', category: 'immune' },
  
  // Longevity
  rs2802292: { gene: 'FOXO3', trait: 'Longévité', category: 'longevity' },
  rs429358: { gene: 'APOE', trait: 'Risque Alzheimer (ε4)', category: 'longevity' },
  rs7412: { gene: 'APOE', trait: 'Profil APOE', category: 'longevity' },
  
  // Skin & Hair
  rs1805007: { gene: 'MC1R', trait: 'Cheveux roux/peau claire', category: 'traits' },
  rs12913832: { gene: 'HERC2', trait: 'Couleur yeux', category: 'traits' },
  rs1426654: { gene: 'SLC24A5', trait: 'Pigmentation peau', category: 'traits' },
}

function detectSource(content: string): '23andme' | 'ancestry' | 'myheritage' | 'ftdna' | 'other' {
  const firstLines = content.slice(0, 2000).toLowerCase()
  
  if (firstLines.includes('23andme')) return '23andme'
  if (firstLines.includes('ancestrydna')) return 'ancestry'
  if (firstLines.includes('myheritage')) return 'myheritage'
  if (firstLines.includes('family tree dna') || firstLines.includes('ftdna')) return 'ftdna'
  
  return 'other'
}

function parseRawDNA(content: string): Map<string, { chromosome: string; position: number; genotype: string }> {
  const snpMap = new Map<string, { chromosome: string; position: number; genotype: string }>()
  const lines = content.split('\n')
  
  for (const line of lines) {
    // Skip comments and headers
    if (line.startsWith('#') || line.startsWith('rsid') || line.trim() === '') continue
    
    // Try different formats
    // 23andMe format: rsid  chromosome  position  genotype
    // AncestryDNA format: rsid  chromosome  position  allele1  allele2
    
    const parts = line.split(/[\t,\s]+/).filter(p => p.trim())
    
    if (parts.length >= 4 && parts[0].startsWith('rs')) {
      const rsid = parts[0].toLowerCase()
      const chromosome = parts[1]
      const position = parseInt(parts[2], 10)
      let genotype = ''
      
      if (parts.length === 4) {
        // 23andMe style: genotype in one field
        genotype = parts[3].toUpperCase()
      } else if (parts.length >= 5) {
        // AncestryDNA style: two alleles
        genotype = (parts[3] + parts[4]).toUpperCase()
      }
      
      if (genotype && genotype !== '--' && genotype !== '00') {
        snpMap.set(rsid, { chromosome, position, genotype })
      }
    }
  }
  
  return snpMap
}

function extractHealthSNPs(snpMap: Map<string, { chromosome: string; position: number; genotype: string }>) {
  const healthResults: Array<{
    rsid: string
    chromosome: string
    position: number
    genotype: string
    gene: string
    trait: string
    category: string
  }> = []
  
  for (const [rsid, info] of Object.entries(HEALTH_SNPS)) {
    const snpData = snpMap.get(rsid.toLowerCase())
    if (snpData) {
      healthResults.push({
        rsid,
        ...snpData,
        gene: info.gene,
        trait: info.trait,
        category: info.category,
      })
    }
  }
  
  return healthResults
}

export async function POST(request: NextRequest) {
  try {
    const { content, fileName, profile, apiKey } = await request.json()

    if (!content) {
      return NextResponse.json(
        { message: 'Aucun contenu fourni' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { message: 'Clé API OpenAI manquante' },
        { status: 400 }
      )
    }

    // Parse the DNA file
    const source = detectSource(content)
    const snpMap = parseRawDNA(content)
    const totalSnps = snpMap.size
    
    if (totalSnps < 100) {
      return NextResponse.json(
        { message: 'Fichier ADN invalide ou trop peu de SNPs détectés. Vérifiez le format du fichier.' },
        { status: 400 }
      )
    }

    // Extract health-related SNPs
    const healthSNPs = extractHealthSNPs(snpMap)
    
    const openai = new OpenAI({ apiKey })

    // Build profile context
    const profileContext = profile
      ? `
Profil de l'utilisateur:
- Prénom: ${profile.firstName}
- Sexe: ${profile.sex === 'male' ? 'Homme' : profile.sex === 'female' ? 'Femme' : 'Autre'}
- Âge: ${profile.age} ans
- Poids: ${profile.weight} kg
- Taille: ${profile.height} cm
- Niveau d'activité: ${profile.sedentaryLevel}
${profile.medicalConditions ? `- Conditions médicales particulières: ${profile.medicalConditions}` : ''}
`
      : ''

    // Create the prompt with extracted SNPs
    const snpsText = healthSNPs.map(s => 
      `${s.rsid} (${s.gene}): ${s.genotype} - ${s.trait}`
    ).join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en génétique qui explique les résultats ADN de manière claire et accessible, même pour un adolescent.

${profileContext}

Voici les SNPs santé extraits du fichier ADN (${healthSNPs.length} SNPs sur ${totalSnps} total):

${snpsText}

IMPORTANT: Réponds UNIQUEMENT en JSON valide avec cette structure:

{
  "source": "${source}",
  "totalSnps": ${totalSnps},
  "analyzedSnps": ${healthSNPs.length},
  "categories": [
    {
      "id": "cardiovascular|metabolism|nutrition|vitamins|fitness|pharmacogenomics|sleep|immune|longevity|traits",
      "name": "Nom de la catégorie en français",
      "score": 0-100,
      "status": "excellent|good|moderate|attention",
      "snps": [
        {
          "rsid": "rs...",
          "chromosome": "1-22 ou X/Y",
          "position": 12345,
          "genotype": "AA/AG/GG etc",
          "gene": "NOM_GENE",
          "trait": "Trait analysé",
          "impact": "positive|neutral|risk",
          "riskLevel": "low|moderate|high (si impact=risk)",
          "description": "Explication simple de ce que signifie ce génotype pour cette personne",
          "recommendation": "Conseil personnalisé si nécessaire"
        }
      ],
      "summary": "Résumé de 2-3 phrases pour cette catégorie"
    }
  ],
  "summary": "Résumé global DÉTAILLÉ (minimum 200 mots) en 3 parties: 1) Vue d'ensemble positive, 2) Points forts génétiques, 3) Points d'attention avec conseils concrets",
  "insights": [
    "Observation clé 1 avec explication",
    "Observation clé 2 avec explication",
    "Observation clé 3 avec explication",
    "Observation clé 4 avec explication",
    "Observation clé 5 avec explication"
  ],
  "recommendations": [
    "Recommandation 1 basée sur ton ADN: action concrète + fréquence + bénéfice",
    "Recommandation 2 basée sur ton ADN: action concrète + fréquence + bénéfice",
    "Recommandation 3 basée sur ton ADN: action concrète + fréquence + bénéfice",
    "Recommandation 4 basée sur ton ADN: action concrète + fréquence + bénéfice"
  ],
  "overallScore": 0-100
}

=== RÈGLES D'INTERPRÉTATION ===

Pour chaque SNP, interprète le génotype selon les connaissances scientifiques actuelles:
- Exemple MTHFR rs1801133: CC = normal, CT = hétérozygote (légère réduction), TT = homozygote (réduction significative)
- Exemple FTO rs9939609: TT = normal, AT = risque modéré obésité, AA = risque élevé
- Exemple LCT rs4988235: GG = intolérance lactose probable, AG = tolérance partielle, AA = tolérance complète
- Exemple ACTN3 rs1815739: CC = puissance/sprint, CT = mixte, TT = endurance

Score par catégorie:
- 90-100: Excellent profil génétique
- 70-89: Bon profil avec quelques variants à surveiller
- 50-69: Profil moyen, adaptations recommandées
- 0-49: Plusieurs variants défavorables, suivi conseillé

=== TON ET STYLE ===
- Langage simple, pas de jargon médical complexe
- Toujours positif et rassurant
- Insiste sur le fait que les gènes ne sont pas une fatalité
- "Ton ADN suggère..." plutôt que "Tu vas..."
- Donne des exemples concrets d'aliments, activités, habitudes

=== AVERTISSEMENT ===
Rappelle que cette analyse est informative et ne remplace pas un avis médical professionnel.
`,
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

    // Parse JSON response
    let analysisResult
    try {
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

    return NextResponse.json(analysisResult)
  } catch (error: any) {
    console.error('DNA Analysis error:', error)
    
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
      { message: error.message || 'Erreur lors de l\'analyse ADN' },
      { status: 500 }
    )
  }
}
