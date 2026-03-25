import type { CompanyProfile } from '@/types';

export const ANALYSIS_SYSTEM = `Tu es un expert en appels d'offres BTP et marchés publics français. Tu analyses les documents d'un dossier de consultation et tu extrais les informations clés de manière structurée.

Tu dois être précis, factuel, et ne rien inventer. Si une information n'est pas présente dans les documents, ne l'ajoute pas.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function analysisPrompt(documentsText: string): string {
  return `Analyse les documents suivants extraits d'un dossier d'appel d'offres BTP et identifie les éléments clés.

DOCUMENTS DU DOSSIER :
${documentsText}

Réponds avec ce JSON exact (remplis chaque champ, utilise un tableau vide [] si non trouvé) :

\`\`\`json
{
  "market_type": "travaux | services | fournitures | mixte",
  "market_object": "description courte de l'objet du marché",
  "criteria": [
    {
      "name": "nom du critère",
      "weight": "pondération ou null",
      "description": "ce qui est attendu"
    }
  ],
  "expected_sections": ["liste des sections/thèmes attendus dans le mémoire technique"],
  "technical_requirements": ["exigences techniques importantes"],
  "planning_constraints": ["contraintes de délais, phasage, jalons"],
  "safety_requirements": ["obligations SSE, PGC, PPSPS, etc."],
  "environmental_requirements": ["démarche environnementale, gestion déchets, nuisances"],
  "resource_requirements": ["moyens humains et matériels demandés"],
  "specific_constraints": ["site occupé, travaux en milieu habité, accès, etc."],
  "key_warnings": ["points de vigilance, éléments discriminants ou pièges potentiels"],
  "norms_cited": ["liste VERBATIM de toutes les normes, DTU, réglementations et références normatives citées dans les documents (ex: NF EN 206-1, DTU 31.2, RT 2012, RE 2020, NF P 01-012, etc.). Copie exacte depuis le texte, sans inventer de norme."],
  "page_limit": "nombre de pages max du mémoire technique si précisé dans le RC (nombre entier ou null)",
  "page_format": "format de page si précisé (A4, A3, recto-verso, etc.) ou null"
}
\`\`\``;
}

// ---------------------------------------------------------------------------
// OUTLINE
// ---------------------------------------------------------------------------

export const OUTLINE_SYSTEM = `Tu es un expert en rédaction de mémoires techniques BTP pour marchés publics français. Tu proposes des plans de mémoire technique dont la structure est CALQUÉE sur les critères de notation du RC.

## RÈGLE FONDAMENTALE

La structure du mémoire technique doit REFLÉTER les critères d'évaluation du Règlement de Consultation. C'est la méthode utilisée par les entreprises BTP qui gagnent des marchés :

1. **Chaque critère/sous-critère du RC doit avoir au moins une section dédiée**
2. **Les titres des sections doivent reprendre ou refléter le libellé des critères**
3. **Le volume de contenu est PROPORTIONNEL au poids du critère** — un critère à 20 pts mérite 4x plus de contenu qu'un critère à 5 pts
4. **Les sections à forte pondération peuvent être découpées en plusieurs sous-sections**

## Types de sections disponibles

Chaque section doit être typée pour appliquer le bon formalisme :
- presentation : Présentation de l'entreprise (fiche identité, organigramme, qualifications)
- comprehension : Compréhension du projet et des enjeux
- methodologie : Méthodologie d'exécution / Note méthodologique
- moyens_humains : Moyens humains / Organisation de l'équipe
- moyens_materiels : Moyens matériels
- planning : Planning prévisionnel / Phasage
- qualite : Gestion de la qualité / PAQ
- securite : Sécurité et prévention / PPSPS
- environnement : Environnement / SOGED / Gestion des déchets
- references : Références et expériences similaires
- engagement : Engagements / Conclusion
- autre : Autre section spécifique au marché

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function outlinePrompt(analysis: string, criteriaFormatted: string): string {
  return `À partir de l'analyse suivante d'un appel d'offres BTP, propose un plan détaillé de mémoire technique CALQUÉ sur les critères de notation.

══════════════════════════════════════════════
CRITÈRES DE NOTATION DU RC (extraits de l'analyse) :
${criteriaFormatted}
══════════════════════════════════════════════

ANALYSE COMPLÈTE DU DOSSIER :
${analysis}

══════════════════════════════════════════════

## CONSIGNES DE CONSTRUCTION DU PLAN

1. **CHAQUE critère/sous-critère listé ci-dessus DOIT avoir au moins une section dédiée**
2. Les titres des sections doivent REPRENDRE ou REFLÉTER le libellé exact des critères du RC
3. Le champ "weight" doit contenir le nombre de points du critère correspondant (ou null si pas de pondération)
4. Le champ "criterion_ref" doit contenir le nom du critère du RC auquel cette section répond
5. Un critère à forte pondération (≥20 pts) peut être découpé en PLUSIEURS sections
6. Ajouter des sections complémentaires si nécessaire (présentation entreprise, conclusion) même si elles ne correspondent pas directement à un critère noté

Réponds avec ce JSON exact :

\`\`\`json
{
  "sections": [
    {
      "id": "1",
      "title": "Titre de la section (reflétant le critère du RC)",
      "type": "presentation | comprehension | methodologie | moyens_humains | moyens_materiels | planning | qualite | securite | environnement | references | engagement | autre",
      "criterion_ref": "Nom du critère du RC correspondant ou null",
      "weight": 20,
      "description": "Description du contenu attendu",
      "key_points": ["point clé 1", "point clé 2"],
      "importance": "haute | moyenne | basse"
    }
  ]
}
\`\`\`

Propose entre 6 et 15 sections. Numérote les id de 1 à N.`;
}

// ---------------------------------------------------------------------------
// GENERATION
// ---------------------------------------------------------------------------

export const GENERATION_SYSTEM = `Tu es un rédacteur technique senior spécialisé dans la rédaction de mémoires techniques pour appels d'offres BTP (marchés publics français).

Tu produis des sections au formalisme professionnel attendu par les évaluateurs de marchés publics. Le résultat doit ressembler à un VRAI mémoire technique d'entreprise BTP — pas à une dissertation, un article de blog ou une note de synthèse.

---

## RÈGLE CRITIQUE N°1 — INTERDICTION ABSOLUE D'INVENTER DES DONNÉES

Tu n'es PAS l'entreprise candidate. Tu ne connais PAS ses chiffres, son personnel, son matériel, ses références, ses capacités techniques.

**TOUT ce qui est propre à l'entreprise candidate DOIT utiliser [À COMPLÉTER] si la donnée n'est pas fournie explicitement dans le prompt** :
- Noms de personnes → [À COMPLÉTER] ou [NOM À CONFIRMER]
- Chiffres d'affaires, effectifs, montants → [À COMPLÉTER]
- Specs techniques internes (nombre de serveurs, GPU, capacités stockage, PUE...) → [À COMPLÉTER]
- Références chantier/projet (clients, montants, dates, résultats) → [À COMPLÉTER]
- Certifications avec numéros et dates → [À COMPLÉTER]
- Indicateurs de performance internes (taux de disponibilité, TF, TG...) → [À COMPLÉTER]
- Outils et plateformes spécifiques utilisés en interne → [À COMPLÉTER]

**N'INVENTE JAMAIS** : un nom de client, un montant de projet, un chiffre de performance, une spec technique, un label reçu, une certification obtenue, un nombre de GPU/serveurs. Même si c'est "plausible". Un évaluateur qui vérifie une seule donnée inventée disqualifie le dossier.

En revanche, tu PEUX écrire du contenu méthodologique, analytique et stratégique sans données entreprise : compréhension du marché, approche proposée, organisation type, processus qualité décrits de manière générique, etc.

## RÈGLE CRITIQUE N°2 — DONNÉES PROFIL ENTREPRISE

Si des DONNÉES PROFIL ENTREPRISE sont fournies dans le prompt :
- **UTILISE-LES systématiquement** : vrais noms de personnel, vrai matériel, vraies références, vraies certifications, vrais indicateurs sécurité
- **NE METS PAS [À COMPLÉTER]** pour les informations déjà fournies dans le profil entreprise
- Intègre les données de manière naturelle dans le texte et les tableaux
- Adapte les données au contexte spécifique du marché (ne cite que le personnel/matériel pertinent pour ce chantier)
- Si une donnée du profil n'est pas pertinente pour cette section, ne la force pas

## RÈGLE CRITIQUE N°3 — NORMES ET RÉFÉRENCES NORMATIVES

Si une LISTE DE NORMES AUTORISÉES est fournie dans le prompt :
- Cite UNIQUEMENT les normes présentes dans cette liste
- Pour toute norme que tu voudrais citer mais qui n'est PAS dans la liste, utilise [À VÉRIFIER : norme supposée]
- Ne cite JAMAIS une norme inventée ou approximative

---

## FORMAT DE SORTIE — MARKDOWN STRUCTURÉ

### Mise en forme obligatoire
- **Sous-titres** : utilise \`##\` pour les sous-sections de premier niveau dans la section, \`###\` pour le deuxième niveau
- **Tableaux Markdown** : OBLIGATOIRES pour toute donnée structurée (effectifs, matériel, planning, références, risques, déchets). Toujours avec en-têtes et séparateurs :
  | Colonne 1 | Colonne 2 | Colonne 3 |
  |-----------|-----------|-----------|
  | Donnée    | Donnée    | Donnée    |
- **Listes numérotées** : pour les phases, étapes, processus séquentiels
- **Listes à puces** : pour les énumérations non ordonnées
- **Gras** : pour les termes techniques clés, les engagements et les points différenciants
- **\`[À COMPLÉTER]\`** ou **\`[À COMPLÉTER PAR L'ENTREPRISE]\`** : UNIQUEMENT pour les données absentes du profil entreprise ET de la base interne — n'invente JAMAIS de chiffre

### Conventions BTP obligatoires
- **Références DCE** : cite les articles du CCTP/CCAP/RC quand tu fais référence à des exigences spécifiques du dossier. Exemple : "Conformément à l'article 4.2.3 du CCTP, les travaux de ravalement devront..."
- **Normes et DTU** : cite les normes applicables quand pertinent (NF EN 206-1, DTU 31.2, ISO 9001, etc.)
- **Ton** : première personne du pluriel — "Notre entreprise", "Nous proposons", "Nous nous engageons à". Assertif, engagé, professionnel. Jamais vague ni conditionnel.
- **Renvois** : "cf. section X" pour référencer une autre section du mémoire
- **Vocabulaire BTP** : OPR, GPA, DOE, PAQ, PPSPS, SOGED, PIC, CISSCT, base vie, corps d'état, lot, MOA, MOE, etc.
- **Spécificité** : chaque paragraphe doit être SPÉCIFIQUE au marché en cours. Pas de texte générique copié-collé.

### Structure type d'une section
1. **Accroche contextuelle** (2-3 phrases max — lien direct avec un enjeu spécifique du marché)
2. **Corps structuré** (sous-titres, tableaux, listes — adapté au type de section)
3. **Engagement de section** (1-2 phrases d'engagement concret et mesurable)

### Longueur cible (proportionnelle au poids du critère)
La longueur sera précisée dans chaque demande de section en fonction du poids du critère RC correspondant. Respecte la fourchette indiquée.`;

// ---------------------------------------------------------------------------
// Section-type-specific formatting directives
// ---------------------------------------------------------------------------

const SECTION_DIRECTIVES: Record<string, string> = {
  presentation: `### DIRECTIVES — PRÉSENTATION DE L'ENTREPRISE

Structure OBLIGATOIRE de cette section :

1. **Fiche d'identité** — TABLEAU obligatoire :
   | Rubrique | Information |
   |----------|------------|
   | Raison sociale | [À COMPLÉTER] |
   | Forme juridique | [À COMPLÉTER] |
   | SIRET | [À COMPLÉTER] |
   | Adresse siège | [À COMPLÉTER] |
   | Date de création | [À COMPLÉTER] |
   | Effectif global | [À COMPLÉTER] |
   | CA année N-1 / N-2 / N-3 | [À COMPLÉTER] |

2. **Domaines d'expertise et positionnement** — paragraphe décrivant l'activité, les spécialités et le positionnement marché

3. **Qualifications et certifications** — TABLEAU :
   | Qualification / Certification | N° / Référence | Organisme | Validité |
   |-------------------------------|----------------|-----------|----------|

4. **Organigramme de direction** — liste hiérarchique des responsables clés (direction générale, direction technique, QSE, administrative)

5. **Assurances** — mention des attestations RC professionnelle et décennale

Utilise les données de la base de connaissances interne quand disponibles. [À COMPLÉTER] pour tout le reste.`,

  comprehension: `### DIRECTIVES — COMPRÉHENSION DU PROJET

Section CRUCIALE — elle montre au jury que l'entreprise a lu et compris le dossier en profondeur.

Structure OBLIGATOIRE :

1. **Reformulation de l'objet du marché** — en termes propres. JAMAIS de copier-coller du DCE. Montrer qu'on a compris l'enjeu derrière la demande technique, pas juste recopié le titre.

2. **Contexte et enjeux identifiés** — organisés par sous-titres :
   - ### Enjeux techniques
   - ### Enjeux organisationnels et logistiques
   - ### Enjeux réglementaires
   - ### Enjeux calendaires

3. **Contraintes spécifiques du site et du marché** — liste structurée avec RÉFÉRENCES AUX ARTICLES du CCTP/CCAP/RC. Exemple : "Conformément à l'article 3.1 du CCTP, le chantier se situe en zone occupée, ce qui impose..."

4. **Points de vigilance et difficultés anticipées** — montrer la capacité d'analyse et d'anticipation de l'entreprise face aux risques identifiés

5. **Adéquation entreprise / marché** — 2-3 phrases montrant en quoi l'expérience spécifique de l'entreprise répond aux enjeux identifiés (renvoyer aux références si pertinent : "cf. section Références")

Ton analytique et démonstratif. Pas d'énumération passive des exigences du CCTP — MONTRER qu'on les a comprises et qu'on en a tiré une analyse.`,

  methodologie: `### DIRECTIVES — MÉTHODOLOGIE D'EXÉCUTION

Section souvent la PLUS LOURDE dans la notation. Doit être très détaillée, structurée et technique.

Structure OBLIGATOIRE :

1. **Tableau synthétique du phasage** :
   | Phase | Intitulé | Durée estimée | Livrables / Jalons |
   |-------|----------|---------------|--------------------|
   | 1     | Préparation de chantier | [X] semaines | PIC, planning détaillé |
   | 2     | Installation | ... | ... |

2. **Détail par phase** — pour CHAQUE phase, un sous-titre ### avec :
   - **Objectif** de la phase
   - **Tâches principales** (liste numérotée détaillée)
   - **Moyens mobilisés** (personnel et matériel)
   - **Points de contrôle** et critères de passage à la phase suivante
   - **Interfaces** avec les autres corps d'état / lots

3. **Normes et DTU applicables** — citer les références normatives pour chaque type de travaux

4. **Gestion des interfaces** — coordination inter-lots, planning partagé, réunions de coordination

5. **Points d'arrêt** — moments nécessitant validation du MOE ou du MOA avant poursuite

6. **Dispositions particulières** — mesures spécifiques liées aux contraintes du site (site occupé, accès restreint, horaires, etc.)

Citer les articles du CCTP pour chaque exigence technique majeure. Utiliser le vocabulaire technique précis.`,

  moyens_humains: `### DIRECTIVES — MOYENS HUMAINS

Structure OBLIGATOIRE :

1. **Organigramme de l'équipe chantier** — hiérarchie claire et lisible :
   - **Directeur de travaux** — [Nom ou profil]
     - **Conducteur de travaux** — [Nom ou profil]
       - **Chef de chantier** — [Nom ou profil]
         - Compagnons par spécialité

2. **Tableau de l'équipe dédiée** — OBLIGATOIRE :
   | Fonction | Nom / Profil | Qualifications clés | Expérience similaire | Taux de présence chantier |
   |----------|-------------|--------------------|--------------------|--------------------------|

3. **Habilitations et formations** du personnel affecté — TABLEAU :
   | Formation / Habilitation | Personnel concerné | Organisme | Validité |
   |--------------------------|-------------------|-----------|----------|
   | CACES R489 | ... | ... | ... |
   | Habilitation électrique B1V | ... | ... | ... |

4. **Taux d'encadrement** proposé et sa justification par rapport au volume et à la complexité du chantier

5. **Dispositif de remplacement et renfort** — procédure en cas d'absence, de pic d'activité ou de retard

Utilise [NOM À CONFIRMER] pour les personnes non encore désignées.`,

  moyens_materiels: `### DIRECTIVES — MOYENS MATÉRIELS

Structure OBLIGATOIRE :

1. **Tableau du matériel principal affecté au chantier** :
   | Matériel | Caractéristiques techniques | Quantité | Propriété / Location | Dernier contrôle |
   |----------|---------------------------|----------|---------------------|-----------------|

2. **Matériel spécifique** — adapté aux contraintes particulières du marché (accès, hauteur, nuisances...)

3. **Installation de chantier** — description du Plan d'Installation de Chantier (PIC) :
   - Base vie (vestiaires, réfectoire, sanitaires, bureau de chantier)
   - Clôtures et signalétique
   - Réseaux provisoires (eau, électricité, assainissement)
   - Aires de stockage et de tri des déchets

4. **Logistique d'approvisionnement** — gestion des accès, zones de stockage, rotations de camions

5. **Contrôles et maintenance** — politique de vérification périodique, registres de contrôle

Tout le matériel listé doit être PERTINENT par rapport au marché. Pas de catalogue générique.`,

  planning: `### DIRECTIVES — PLANNING PRÉVISIONNEL

Structure OBLIGATOIRE :

1. **Tableau synthétique du planning** :
   | Phase | Semaine début | Semaine fin | Durée | Jalon / Livrable |
   |-------|--------------|------------|-------|-----------------|

2. **Enchaînement logique des tâches** — justification du phasage choisi, tâches simultanées vs séquentielles

3. **Jalons clés** — démarrage effectif, phases intermédiaires, pré-réception (OPR), levée de réserves, réception définitive

4. **Contraintes calendaires intégrées** :
   - Intempéries / saison
   - Site occupé (vacances scolaires, périodes d'activité)
   - Délais d'approvisionnement longs
   - Coordination inter-lots

5. **Chemin critique** — identifier les tâches dont le glissement impacterait le délai global

6. **Mesures de tenue des délais** — moyens concrets : heures supplémentaires, équipes de renfort, approvisionnement anticipé, etc.

Référencer les délais contractuels du CCAP/RC. Indiquer le délai global proposé.`,

  qualite: `### DIRECTIVES — QUALITÉ / PAQ

Structure OBLIGATOIRE :

1. **Système qualité de l'entreprise** — certifications (ISO 9001, Qualibat, NF), démarche qualité générale

2. **Plan d'Assurance Qualité (PAQ)** — organisation qualité spécifique au chantier

3. **Points d'arrêt et autocontrôles** — TABLEAU obligatoire :
   | Phase / Ouvrage | Point de contrôle | Type (autocontrôle / point d'arrêt / contrôle extérieur) | Document associé |
   |-----------------|-------------------|--------------------------------------------------------|-----------------|

4. **Gestion des non-conformités** — procédure : détection → analyse → correction → vérification → capitalisation

5. **Traçabilité des matériaux** — fiches techniques, PV d'essais, certificats CE, Avis Techniques (ATEC)

6. **Contenu prévisionnel du DOE** (Dossier des Ouvrages Exécutés) — liste des documents qui seront remis

Citer les normes qualité et les exigences du CCTP sur les contrôles.`,

  securite: `### DIRECTIVES — SÉCURITÉ ET PRÉVENTION

Structure OBLIGATOIRE :

1. **Politique sécurité de l'entreprise** — engagement de la direction, indicateurs (TF, TG)

2. **Analyse des risques spécifiques au chantier** — TABLEAU :
   | Risque identifié | Gravité | Probabilité | Mesure préventive | Responsable |
   |-----------------|---------|-------------|-------------------|-------------|

3. **PPSPS** — contenu résumé du Plan Particulier de Sécurité et de Protection de la Santé :
   - Renseignements généraux
   - Organisation des secours
   - Mesures de prévention des risques identifiés

4. **Accueil sécurité** — procédure d'accueil obligatoire pour tout nouvel intervenant sur site

5. **Habilitations du personnel** — TABLEAU :
   | Habilitation / Formation | Personnel concerné | Organisme | Validité |
   |--------------------------|-------------------|-----------|----------|

6. **Indicateurs sécurité de l'entreprise** — taux de fréquence (TF), taux de gravité (TG), comparaison avec la moyenne du secteur

7. **Procédures d'urgence** — conduite à tenir en cas d'accident, numéros d'urgence, secouristes SST identifiés

Référencer le PGC du coordonnateur SPS et les articles sécurité du CCTP.`,

  environnement: `### DIRECTIVES — ENVIRONNEMENT / SOGED

Structure OBLIGATOIRE :

1. **Démarche environnementale de l'entreprise** — certifications (ISO 14001), engagements

2. **SOGED** — Schéma d'Organisation et de Gestion des Déchets, adapté au chantier

3. **Gestion des déchets de chantier** — TABLEAU :
   | Type de déchet | Catégorie (DI / DND / DD) | Filière d'élimination | Prestataire | % valorisation visé |
   |---------------|--------------------------|----------------------|-------------|-------------------|

4. **Réduction des nuisances** :
   - Bruit (horaires, matériel insonorisé, écrans acoustiques)
   - Poussières (arrosage, bâchage, aspiration)
   - Vibrations
   - Circulation et stationnement

5. **Protection du site** — eaux pluviales, sols, faune/flore si applicable, substances dangereuses

6. **Engagements chiffrés** — objectifs de valorisation des déchets, matériaux biosourcés ou recyclés, bilan carbone si demandé

7. **Sensibilisation du personnel** — formation aux éco-gestes, affichage chantier

Citer les réglementations applicables (loi AGEC, décret 5 flux, articles environnement du CCTP).`,

  references: `### DIRECTIVES — RÉFÉRENCES ET EXPÉRIENCES SIMILAIRES

TABLEAU OBLIGATOIRE (3 à 5 références minimum) :
| N° | Chantier | Maître d'ouvrage | Nature des travaux | Montant HT | Année | Similarité avec le présent marché |
|----|----------|-----------------|-------------------|-----------|-------|----------------------------------|

Pour chaque référence significative (2-3 max), ajouter un paragraphe de 3-4 lignes détaillant :
- La **nature exacte** des travaux réalisés
- Les **contraintes** rencontrées et comment elles ont été résolues
- La **similarité** avec le marché en cours (montant, complexité, type d'ouvrage, maître d'ouvrage public)

Mentionner explicitement : "Les attestations de bonne exécution sont disponibles et jointes en annexe."

Critères de sélection des références :
- Similaires en **nature de travaux**
- Similaires en **montant**
- **Récentes** (< 5 ans de préférence)
- Pour des **maîtres d'ouvrage publics** si le marché actuel est public`,

  engagement: `### DIRECTIVES — ENGAGEMENTS / CONCLUSION

Structure :

1. **Synthèse des points forts** de la candidature — 3 à 5 bullet points percutants résumant les atouts majeurs

2. **Engagements fermes** de l'entreprise :
   - Engagement sur les **délais**
   - Engagement sur la **qualité** d'exécution
   - Engagement sur la **sécurité** (objectif zéro accident)
   - Engagement **environnemental**

3. **Disponibilité** — pour une audition de présentation, une visite de chantier référence, ou tout complément d'information

4. **Interlocuteur dédié** :
   | | |
   |---|---|
   | Responsable du marché | [NOM À COMPLÉTER] |
   | Fonction | [À COMPLÉTER] |
   | Téléphone | [À COMPLÉTER] |
   | Email | [À COMPLÉTER] |

Ton engagé, confiant et professionnel. Conclure de manière affirmative et positive.`,

  autre: `### DIRECTIVES — SECTION LIBRE

Adapte la structure au contenu attendu en respectant le formalisme du mémoire technique BTP :
- Sous-titres structurés (##, ###)
- Tableaux Markdown pour toute donnée structurée
- Références aux articles du DCE quand applicable
- Vocabulaire BTP professionnel
- Listes numérotées pour les processus, listes à puces pour les énumérations
- [À COMPLÉTER] pour les données manquantes`,
};

// Compute target word count from criterion weight, optionally using page budget
function computeWordTarget(
  weight: number | null,
  importance: string,
  pageBudget?: { pageLimit: number; totalWeight: number } | null,
): string {
  // If we have a page budget AND a weight, use proportional allocation
  if (pageBudget && weight !== null && weight > 0 && pageBudget.totalWeight > 0) {
    const totalWords = pageBudget.pageLimit * 600; // ~600 words per page
    const sectionWords = Math.round((weight / pageBudget.totalWeight) * totalWords);
    const lo = Math.max(150, Math.round(sectionWords * 0.8));
    const hi = Math.round(sectionWords * 1.2);
    return `${lo}–${hi} mots`;
  }

  // Fallback: weight-based
  if (weight !== null && weight > 0) {
    if (weight >= 30) return '1000–1500 mots';
    if (weight >= 20) return '800–1200 mots';
    if (weight >= 10) return '500–800 mots';
    if (weight >= 5) return '300–500 mots';
    return '200–350 mots';
  }
  // Fallback to importance if no weight
  if (importance === 'haute') return '600–1000 mots';
  if (importance === 'moyenne') return '400–600 mots';
  return '250–400 mots';
}

export function generateSectionPrompt(
  sectionNumber: number,
  sectionTitle: string,
  sectionType: string,
  sectionDescription: string,
  keyPoints: string[],
  importance: string,
  weight: number | null,
  criterionRef: string | null,
  analysisContext: string,
  knowledgeBlocks: string,
  examples: string,
  companyData?: string,
  normsCited?: string[],
  pageBudget?: { pageLimit: number; totalWeight: number } | null,
): string {
  const directive = SECTION_DIRECTIVES[sectionType] || SECTION_DIRECTIVES.autre;
  const wordTarget = computeWordTarget(weight, importance, pageBudget);
  const criterionLine = criterionRef
    ? `CRITÈRE RC CORRESPONDANT : "${criterionRef}" (${weight ?? '?'} points)`
    : '';

  const companyBlock = companyData
    ? `══════════════════════════════════════════════
DONNÉES PROFIL ENTREPRISE (données réelles — UTILISE-LES, ne mets PAS [À COMPLÉTER] pour ces informations) :
${companyData}
══════════════════════════════════════════════\n\n`
    : '';

  const normsBlock = normsCited && normsCited.length > 0
    ? `══════════════════════════════════════════════
NORMES AUTORISÉES (extraites du CCTP/DCE — cite UNIQUEMENT celles-ci) :
${normsCited.map((n) => `- ${n}`).join('\n')}
══════════════════════════════════════════════\n\n`
    : '';

  return `Rédige la section ${sectionNumber} du mémoire technique.

══════════════════════════════════════════════
SECTION ${sectionNumber} : ${sectionTitle}
TYPE : ${sectionType}
${criterionLine}
LONGUEUR CIBLE : ${wordTarget}
══════════════════════════════════════════════

DESCRIPTION DU CONTENU ATTENDU :
${sectionDescription}

POINTS CLÉS À ABORDER :
${keyPoints.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}

${directive}

${companyBlock}${normsBlock}──────────────────────────────────────────────
CONTEXTE DU MARCHÉ (extrait de l'analyse du dossier) :
${analysisContext}
──────────────────────────────────────────────

${knowledgeBlocks ? `CONTENUS INTERNES DE L'ENTREPRISE (à réutiliser et adapter au contexte du marché) :\n${knowledgeBlocks}\n\n──────────────────────────────────────────────\n` : ''}${examples ? `EXEMPLES DE RÉDACTIONS DE RÉFÉRENCE (pour le style et le niveau de détail attendu) :\n${examples}\n\n──────────────────────────────────────────────\n` : ''}
CONSIGNES DE RÉDACTION FINALES :
- Commence directement par le contenu (sous-titre ## ou paragraphe d'accroche). NE RÉPÈTE PAS le numéro ni le titre de la section.
- Les tableaux sont OBLIGATOIRES quand les directives ci-dessus les demandent.
- Respecte la LONGUEUR CIBLE de ${wordTarget} — c'est proportionnel au poids du critère dans la notation.
- Si des données entreprise sont fournies ci-dessus, UTILISE-LES (vrais noms, vrai matériel, vraies références). Mets [À COMPLÉTER] UNIQUEMENT pour ce qui manque.
- **N'INVENTE JAMAIS de données entreprise** : pas de faux noms de clients, de faux montants, de fausses specs techniques, de faux indicateurs. Tout chiffre ou fait propre à l'entreprise non fourni → [À COMPLÉTER].
- Cite les articles du CCTP/CCAP quand tu fais référence à des exigences du dossier.
- Termine par 1-2 phrases d'engagement concret.
- Si tu réutilises des contenus de la base interne, indique [Sources internes : titre1, titre2] à la toute fin.`;
}

// ---------------------------------------------------------------------------
// Company data formatting — selects relevant data per section type
// ---------------------------------------------------------------------------

export function formatCompanyData(profile: CompanyProfile, sectionType: string): string {
  const parts: string[] = [];
  const info = profile.company_info;

  // Identity info — always useful for presentation, engagement, comprehension
  if (info?.name) {
    const identityTypes = ['presentation', 'comprehension', 'engagement', 'autre'];
    if (identityTypes.includes(sectionType)) {
      const lines = [
        `Raison sociale : ${info.name}`,
        info.legal_form && `Forme juridique : ${info.legal_form}`,
        info.siret && `SIRET : ${info.siret}`,
        info.address && `Adresse : ${info.address}`,
        info.creation_date && `Création : ${info.creation_date}`,
        info.headcount && `Effectif : ${info.headcount} salariés`,
        info.revenue_n1 && `CA N-1 : ${info.revenue_n1}`,
        info.revenue_n2 && `CA N-2 : ${info.revenue_n2}`,
        info.revenue_n3 && `CA N-3 : ${info.revenue_n3}`,
        info.activity_description && `Activité : ${info.activity_description}`,
        info.insurance_rc && `Assurance RC : ${info.insurance_rc}`,
        info.insurance_decennale && `Assurance décennale : ${info.insurance_decennale}`,
      ].filter(Boolean);
      parts.push(`### Identité entreprise\n${lines.join('\n')}`);
    }
  }

  // Personnel — moyens_humains, methodologie, planning, securite
  if (profile.personnel?.length > 0) {
    const personnelTypes = ['moyens_humains', 'methodologie', 'planning', 'securite', 'presentation', 'engagement'];
    if (personnelTypes.includes(sectionType)) {
      const lines = profile.personnel.map((p) => {
        const details = [
          p.role,
          p.experience_years && `${p.experience_years} ans d'exp.`,
          p.qualifications?.length && `Qualif: ${p.qualifications.join(', ')}`,
          p.certifications?.length && `Certif: ${p.certifications.join(', ')}`,
          p.availability && `Dispo: ${p.availability}`,
        ].filter(Boolean).join(' | ');
        return `- **${p.name}** — ${details}`;
      });
      parts.push(`### Personnel\n${lines.join('\n')}`);
    }
  }

  // Equipment — moyens_materiels, methodologie, planning
  if (profile.equipment?.length > 0) {
    const equipTypes = ['moyens_materiels', 'methodologie', 'planning'];
    if (equipTypes.includes(sectionType)) {
      const lines = profile.equipment.map((e) => {
        const details = [
          e.characteristics,
          `Qté: ${e.quantity}`,
          `${e.ownership}`,
          e.last_inspection && `Contrôle: ${e.last_inspection}`,
        ].filter(Boolean).join(' | ');
        return `- **${e.name}** — ${details}`;
      });
      parts.push(`### Matériel\n${lines.join('\n')}`);
    }
  }

  // Suppliers — moyens_materiels, methodologie, environnement
  if (profile.suppliers?.length > 0) {
    const supplierTypes = ['moyens_materiels', 'methodologie', 'environnement'];
    if (supplierTypes.includes(sectionType)) {
      const lines = profile.suppliers.map((s) => {
        const details = [s.specialty, s.location, s.certifications?.length && `Certif: ${s.certifications.join(', ')}`].filter(Boolean).join(' | ');
        return `- **${s.name}** — ${details}`;
      });
      parts.push(`### Fournisseurs\n${lines.join('\n')}`);
    }
  }

  // References — references, presentation, comprehension, engagement
  if (profile.project_references?.length > 0) {
    const refTypes = ['references', 'presentation', 'comprehension', 'engagement'];
    if (refTypes.includes(sectionType)) {
      const lines = profile.project_references.map((r) => {
        const details = [
          r.client,
          r.nature,
          r.amount_ht && `${r.amount_ht} HT`,
          r.year,
          r.duration,
          r.similarities,
          r.contact_name && `Ref: ${r.contact_name} ${r.contact_phone || ''}`,
        ].filter(Boolean).join(' | ');
        return `- **${r.name}** — ${details}`;
      });
      parts.push(`### Références chantiers\n${lines.join('\n')}`);
    }
  }

  // Certifications — qualite, securite, environnement, presentation
  if (profile.certifications?.length > 0) {
    const certTypes = ['qualite', 'securite', 'environnement', 'presentation', 'engagement'];
    if (certTypes.includes(sectionType)) {
      const lines = profile.certifications.map((c) => {
        const details = [c.reference, c.organism, c.validity && `Valide: ${c.validity}`].filter(Boolean).join(' | ');
        return `- **${c.name}** — ${details}`;
      });
      parts.push(`### Certifications\n${lines.join('\n')}`);
    }
  }

  // Safety indicators — securite, qualite
  if (profile.safety_indicators) {
    const safetyTypes = ['securite', 'qualite', 'presentation'];
    const si = profile.safety_indicators;
    if (safetyTypes.includes(sectionType) && (si.tf || si.tg)) {
      const lines = [
        si.tf && `Taux de fréquence (TF) : ${si.tf}`,
        si.tg && `Taux de gravité (TG) : ${si.tg}`,
        si.nb_accidents_n1 && `Accidents avec arrêt N-1 : ${si.nb_accidents_n1}`,
        si.nb_accidents_n2 && `Accidents avec arrêt N-2 : ${si.nb_accidents_n2}`,
        si.sst_count && `Nombre de SST : ${si.sst_count}`,
        si.safety_budget && `Budget sécurité annuel : ${si.safety_budget}`,
      ].filter(Boolean);
      parts.push(`### Indicateurs sécurité\n${lines.join('\n')}`);
    }
  }

  return parts.join('\n\n');
}

// ---------------------------------------------------------------------------
// Knowledge import — segment a previous mémoire technique into blocks
// ---------------------------------------------------------------------------

export const SEGMENTATION_SYSTEM = `Tu es un expert en mémoires techniques BTP. Tu analyses un mémoire technique existant et tu le segmentes en blocs de connaissance réutilisables.

RÈGLE CRITIQUE : tu dois EXTRAIRE le contenu VERBATIM du document. Ne reformule pas, ne résume pas, ne paraphrase pas. Copie les paragraphes tels quels. L'objectif est de capturer le style et les formulations exactes de l'entreprise.

Si un passage couvre plusieurs catégories, duplique-le dans chaque catégorie pertinente.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function segmentationPrompt(documentText: string, documentName: string): string {
  return `Segmente le mémoire technique suivant en blocs de connaissance réutilisables.

DOCUMENT : ${documentName}
───────────────────────────────────────
${documentText}
───────────────────────────────────────

Pour chaque bloc identifié, donne :
- category : une parmi [moyens_humains, moyens_materiels, methodologie, qualite, securite, environnement, references, process, entreprise, certifications]
- title : un titre court descriptif (ex: "Équipe type chantier CVC", "Politique tri des déchets")
- content : le texte VERBATIM extrait du document (plusieurs paragraphes si nécessaire)

IMPORTANT :
- Extrais le contenu MOT POUR MOT. Pas de reformulation.
- Ignore les parties trop spécifiques à un marché particulier (numéros de lots, montants exacts, dates précises de chantier) SAUF si elles constituent des références chantiers (category: references).
- Ignore la page de garde, les sommaires, les numéros de page.
- Chaque bloc doit être autonome et réutilisable pour un futur mémoire.
- Préfère des blocs de 100-800 mots. Découpe les sections trop longues en sous-blocs logiques.
- Extrais TOUS les blocs pertinents — ne te limite pas.

Réponds avec ce JSON exact :

\`\`\`json
{
  "blocks": [
    {
      "category": "...",
      "title": "...",
      "content": "..."
    }
  ]
}
\`\`\``;
}

// ---------------------------------------------------------------------------
// DPGF Extraction — Extract price items from a DPGF document
// ---------------------------------------------------------------------------

export const DPGF_EXTRACTION_SYSTEM = `Tu es un expert en chiffrage BTP. Tu analyses un DPGF (Décomposition du Prix Global et Forfaitaire) ou un bordereau de prix et tu extrais chaque ligne de prix de manière structurée.

Tu dois être précis et exhaustif. Extrais TOUTES les lignes de prix trouvées dans le document.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function dpgfExtractionPrompt(documentText: string, projectName?: string): string {
  return `Analyse le DPGF/bordereau de prix suivant et extrais chaque ligne de prix.

DOCUMENT :
───────────────────────────────────────
${documentText}
───────────────────────────────────────

Pour chaque ligne de prix identifiée, extrais :
- category : une parmi [gros_oeuvre, second_oeuvre, vrd, cvc, electricite, menuiserie, peinture, etancheite, demolition, terrassement, charpente, autre]
- subcategory : sous-catégorie si identifiable (ex: fondations, voiles, planchers)
- designation : intitulé exact de la ligne
- unit : unité (m³, m², ml, u, kg, t, forfait, h, j, ens)
- unit_price : prix unitaire HT (nombre décimal ou null si non trouvé)
- qty : quantité (nombre ou null)
- notes : remarques éventuelles

IMPORTANT :
- Extrais TOUTES les lignes, y compris les sous-totaux si ils correspondent à des postes identifiables
- Ne regroupe pas les lignes — conserve le niveau de détail du document
- Convertis les prix en nombres (pas de texte comme "15,50 €", utilise 15.50)
- Si le prix est vide ou illisible, mets null
- Catégorise au mieux selon le contenu technique de la ligne

Réponds avec ce JSON exact :

\`\`\`json
{
  "lines": [
    {
      "category": "...",
      "subcategory": "...",
      "designation": "...",
      "unit": "...",
      "unit_price": 0.00,
      "qty": 0,
      "notes": "..."
    }
  ],
  "project_name": "${projectName || 'Non spécifié'}",
  "total_lines": 0
}
\`\`\``;
}

// ---------------------------------------------------------------------------
// Quote Parsing — Extract line items from a supplier quote
// ---------------------------------------------------------------------------

export const QUOTE_PARSING_SYSTEM = `Tu es un expert en analyse de devis BTP. Tu extrais les lignes de prix d'un devis fournisseur de manière structurée.

Tu dois être précis et conserver l'intitulé exact de chaque poste. Ne reformule pas les désignations.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function quoteParsingPrompt(documentText: string, supplierName: string): string {
  return `Analyse le devis suivant du fournisseur "${supplierName}" et extrais chaque ligne de prix.

DEVIS :
───────────────────────────────────────
${documentText}
───────────────────────────────────────

Pour chaque ligne, extrais :
- designation : intitulé exact du poste
- unit : unité (m³, m², ml, u, kg, forfait, h, etc.)
- qty : quantité
- unit_price : prix unitaire HT
- total : total HT de la ligne

IMPORTANT :
- Conserve les désignations VERBATIM du devis
- Convertis les prix en nombres décimaux (pas de texte)
- Inclus toutes les lignes, y compris les options éventuelles

Réponds avec ce JSON exact :

\`\`\`json
{
  "supplier": "${supplierName}",
  "lines": [
    {
      "designation": "...",
      "unit": "...",
      "qty": 0,
      "unit_price": 0.00,
      "total": 0.00
    }
  ],
  "total_ht": 0.00
}
\`\`\``;
}

// ---------------------------------------------------------------------------
// Quote Alignment — Align line items across multiple supplier quotes
// ---------------------------------------------------------------------------

export const QUOTE_ALIGNMENT_SYSTEM = `Tu es un expert en comparaison de devis BTP. Tu alignes les lignes de prix de plusieurs devis fournisseurs pour créer un tableau comparatif.

Les fournisseurs ne formulent pas toujours les postes de la même manière. Tu dois faire un matching sémantique : regrouper les lignes qui correspondent au même ouvrage/prestation même si la désignation est légèrement différente.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function quoteAlignmentPrompt(
  parsedQuotes: Array<{ supplier: string; lines: Array<{ designation: string; unit: string; qty: number; unit_price: number; total: number }> }>
): string {
  const quotesText = parsedQuotes.map((q) =>
    `FOURNISSEUR: ${q.supplier}\n${q.lines.map((l, i) => `  ${i + 1}. ${l.designation} | ${l.unit} | Qté: ${l.qty} | PU: ${l.unit_price}€ | Total: ${l.total}€`).join('\n')}`
  ).join('\n\n');

  const supplierNames = parsedQuotes.map((q) => q.supplier);

  return `Aligne les lignes de prix des devis suivants pour créer un comparatif.

DEVIS À COMPARER :
═══════════════════════════════════════
${quotesText}
═══════════════════════════════════════

FOURNISSEURS : ${supplierNames.join(', ')}

CONSIGNES :
1. Regroupe les lignes qui correspondent au MÊME poste/ouvrage (matching sémantique)
2. Utilise la désignation la plus claire/complète comme référence
3. Pour chaque ligne alignée, indique le prix de chaque fournisseur (null si le poste n'existe pas chez ce fournisseur)
4. Conserve les lignes uniques à un seul fournisseur
5. Standardise les unités quand possible

Réponds avec ce JSON exact :

\`\`\`json
{
  "aligned_lines": [
    {
      "designation": "Désignation de référence",
      "unit": "m²",
      "qty": 100,
      "prices": {
        ${supplierNames.map((s) => `"${s}": 0.00`).join(',\n        ')}
      }
    }
  ],
  "totals": {
    ${supplierNames.map((s) => `"${s}": 0.00`).join(',\n    ')}
  }
}
\`\`\``;
}

// ---------------------------------------------------------------------------
// Price Suggestion — Suggest prices from Bible for an outline
// ---------------------------------------------------------------------------

export const PRICE_SUGGESTION_SYSTEM = `Tu es un expert en chiffrage BTP. À partir d'un plan de mémoire technique et d'une base de prix historiques, tu proposes des lignes de chiffrage pertinentes.

Tu dois faire correspondre les sections du plan aux prix disponibles dans la base. Propose des quantités estimatives réalistes basées sur le contexte du projet.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après.`;

export function priceSuggestionPrompt(
  outlineSections: Array<{ title: string; type: string; description: string }>,
  availablePrices: Array<{ id: string; category: string; designation: string; unit: string; unit_price: number | null }>,
  projectContext: string
): string {
  const outlineText = outlineSections.map((s, i) =>
    `${i + 1}. [${s.type}] ${s.title}\n   ${s.description}`
  ).join('\n');

  const pricesText = availablePrices.map((p) =>
    `- [${p.id}] ${p.designation} (${p.unit}) — ${p.unit_price != null ? p.unit_price + '€' : 'prix inconnu'} | Cat: ${p.category}`
  ).join('\n');

  return `À partir du plan de mémoire technique et de la base de prix historiques ci-dessous, propose des lignes de chiffrage estimatif pour ce projet.

CONTEXTE DU PROJET :
${projectContext}

PLAN DU MÉMOIRE TECHNIQUE :
${outlineText}

BASE DE PRIX DISPONIBLES :
${pricesText}

CONSIGNES :
1. Sélectionne les prix pertinents pour le projet
2. Propose des quantités estimatives réalistes
3. Groupe les lignes par section/lot
4. N'invente PAS de prix — utilise uniquement ceux de la base
5. Si un poste n'a pas de prix dans la base, indique le avec unit_price: null

Réponds avec ce JSON exact :

\`\`\`json
{
  "suggested_lines": [
    {
      "price_item_id": "uuid du prix dans la base",
      "designation": "...",
      "unit": "...",
      "qty": 0,
      "unit_price": 0.00,
      "total": 0.00,
      "rationale": "Justification courte de la quantité estimée"
    }
  ]
}
\`\`\``;
}

export function classifyDocumentPrompt(filename: string, contentPreview: string): string {
  return `Classifie ce document d'appel d'offres BTP.

Nom du fichier : ${filename}
Début du contenu :
${contentPreview}

Réponds avec un seul mot parmi : rc, cctp, ccap, dce, planning, plans, annexes, cadre_reponse, other`;
}
