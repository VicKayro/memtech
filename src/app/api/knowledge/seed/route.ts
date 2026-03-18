import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SEED_KNOWLEDGE = [
  {
    category: 'entreprise',
    title: 'Présentation de l\'entreprise',
    content: `[NOM DE L'ENTREPRISE] est une PME du BTP employant 85 collaborateurs, spécialisée dans [DOMAINES D'ACTIVITÉ : gros œuvre, second œuvre, CVC, électricité, etc.].

Fondée en [ANNÉE], l'entreprise intervient principalement sur le territoire [ZONE GÉOGRAPHIQUE] pour des marchés publics et privés.

Chiffre d'affaires : [CA] M€
Effectif moyen : 85 personnes dont [X] cadres, [Y] compagnons
Siège social : [ADRESSE]

Notre positionnement repose sur la qualité d'exécution, le respect des délais et un engagement fort en matière de sécurité et d'environnement.`,
  },
  {
    category: 'moyens_humains',
    title: 'Organisation type d\'un chantier',
    content: `Pour un chantier de cette envergure, nous mobilisons une équipe structurée :

- 1 Directeur de travaux (supervision globale, interface MOA/MOE)
- 1 Conducteur de travaux dédié (pilotage quotidien, coordination sous-traitants)
- 1 Chef de chantier permanent (encadrement terrain, qualité d'exécution)
- [X] Compagnons qualifiés selon les lots
- 1 Responsable QSE intervenant (audits chantier, PGC, PPSPS)

L'organigramme est adapté à chaque marché en fonction du volume, de la technicité et des contraintes spécifiques du site.

L'ensemble du personnel dispose des habilitations nécessaires : CACES, habilitations électriques, travail en hauteur, SST.`,
  },
  {
    category: 'moyens_materiels',
    title: 'Parc matériel',
    content: `Notre parc matériel propre comprend :

- [X] véhicules utilitaires et poids lourds
- Engins de terrassement : pelle hydraulique, mini-pelle, chargeuse
- Matériel de levage : grue mobile, nacelles élévatrices
- Outillage électroportatif complet
- Base vie complète (bungalows, sanitaires, réfectoire)
- Matériel topographique (station totale, niveau laser)

Le matériel spécifique non disponible en interne est loué auprès de partenaires référencés (contrats-cadres avec [LOUEURS]).

Tout le matériel fait l'objet d'un contrôle périodique et d'une maintenance préventive tracée.`,
  },
  {
    category: 'methodologie',
    title: 'Méthodologie générale d\'intervention',
    content: `Notre méthodologie repose sur un processus éprouvé en 5 phases :

1. PRÉPARATION DE CHANTIER (2 à 4 semaines avant démarrage)
   - Visite de site détaillée et relevés
   - Élaboration du planning détaillé et plan d'installation de chantier
   - Commandes anticipées des matériaux et sous-traitants
   - Réunion de lancement interne

2. INSTALLATION DE CHANTIER
   - Mise en place de la base vie et clôtures
   - Signalétique et balisage
   - Réseaux provisoires (eau, électricité, assainissement)

3. EXÉCUTION DES TRAVAUX
   - Réunions de chantier hebdomadaires
   - Reporting photographique et journal de chantier
   - Contrôles qualité par étapes (fiches d'autocontrôle)
   - Coordination permanente avec les corps d'état

4. RÉCEPTION
   - Levée de réserves méthodique
   - Dossier des Ouvrages Exécutés (DOE)
   - Formation des utilisateurs si applicable

5. GARANTIE DE PARFAIT ACHÈVEMENT
   - Interlocuteur dédié pendant toute la durée de la GPA
   - Interventions sous 48h pour les urgences`,
  },
  {
    category: 'qualite',
    title: 'Démarche qualité',
    content: `Notre démarche qualité s'appuie sur :

- Certification [ISO 9001 / Qualibat / autre] en cours de validité
- Processus d'autocontrôle systématique à chaque phase
- Fiches de contrôle qualité par type d'ouvrage
- Traçabilité complète des matériaux (fiches techniques, PV d'essais, certificats)
- Revue de contrat systématique à la prise de commande
- Retour d'expérience après chaque chantier

Les non-conformités sont traitées selon une procédure formalisée : détection, analyse, correction, vérification, capitalisation.`,
  },
  {
    category: 'securite',
    title: 'Politique sécurité et prévention des risques',
    content: `La sécurité est une valeur fondamentale de notre entreprise :

- Taux de fréquence des accidents : [TF] (moyenne nationale BTP : ~25)
- Responsable QSE dédié
- PPSPS systématique et adapté à chaque chantier
- Quart d'heure sécurité hebdomadaire sur site
- Accueil sécurité obligatoire pour tout nouvel intervenant
- Analyse des risques formalisée (DUER, plan de prévention)
- EPI fournis et contrôlés régulièrement
- Formation continue : SST, travail en hauteur, risques chimiques, amiante SS4

Nous mettons un point d'honneur à dépasser les exigences réglementaires en matière de prévention.`,
  },
  {
    category: 'environnement',
    title: 'Engagement environnemental',
    content: `Notre démarche environnementale comprend :

- Tri sélectif systématique sur chantier (5 flux minimum)
- Bordereaux de suivi des déchets (BSD) pour tous les déchets dangereux
- Partenariat avec des filières de valorisation agréées
- Réduction des nuisances sonores (horaires adaptés, matériel insonorisé)
- Gestion des eaux de ruissellement et prévention des pollutions
- Bilan carbone chantier sur demande
- Utilisation privilégiée de matériaux biosourcés et circuits courts quand possible
- Sensibilisation des compagnons aux éco-gestes

Objectif : valorisation de [X]% des déchets de chantier (vs obligation réglementaire de 70%).`,
  },
  {
    category: 'references',
    title: 'Références chantiers similaires',
    content: `Nous disposons de nombreuses références sur des chantiers similaires :

1. [NOM DU CHANTIER 1] — [ANNÉE]
   Maître d'ouvrage : [MOA]
   Montant : [X] k€ HT
   Description : [description courte]
   Particularité : [contrainte notable résolue]

2. [NOM DU CHANTIER 2] — [ANNÉE]
   Maître d'ouvrage : [MOA]
   Montant : [X] k€ HT
   Description : [description courte]
   Particularité : [contrainte notable résolue]

3. [NOM DU CHANTIER 3] — [ANNÉE]
   Maître d'ouvrage : [MOA]
   Montant : [X] k€ HT
   Description : [description courte]
   Particularité : [contrainte notable résolue]

Attestations de bonne exécution disponibles sur demande.`,
  },
  {
    category: 'certifications',
    title: 'Certifications et labels',
    content: `Nos certifications et qualifications en cours de validité :

- Qualibat [numéros et intitulés des qualifications]
- [ISO 9001 / ISO 14001 / ISO 45001] — organisme certificateur : [NOM]
- RGE (Reconnu Garant de l'Environnement) — domaines : [liste]
- MASE (si applicable)
- Habilitations amiante sous-section 4

Toutes nos certifications sont à jour et disponibles pour consultation.`,
  },
  {
    category: 'process',
    title: 'Gestion de la co-activité et des interfaces',
    content: `Sur les chantiers en co-activité ou en site occupé, nous mettons en place :

- Plan de circulation et zonage des interventions
- Planning inter-entreprises coordonné
- Réunions de coordination hebdomadaires
- Consignes spécifiques de cohabitation avec les usagers
- Balisage et protections renforcées des zones d'intervention
- Communication régulière avec le maître d'ouvrage et les occupants
- Horaires d'intervention adaptés pour limiter les nuisances

Notre expérience des chantiers en milieu occupé (établissements scolaires, hôpitaux, bureaux) nous permet de garantir la continuité d'activité du site.`,
  },
];

export async function POST() {
  // Check if knowledge already exists
  const { count } = await supabase
    .from('knowledge_blocks')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    return NextResponse.json({
      message: `Base déjà initialisée avec ${count} blocs. Supprimez-les d'abord si vous voulez réinitialiser.`,
      count,
    });
  }

  const { data, error } = await supabase
    .from('knowledge_blocks')
    .insert(SEED_KNOWLEDGE)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    message: `${data.length} blocs de connaissance ajoutés avec succès`,
    count: data.length,
  });
}
