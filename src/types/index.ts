export interface Project {
  id: string;
  name: string;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'outlined' | 'generating' | 'generated';
  market_type: string | null;
  analysis: Analysis | null;
  outline: OutlineSection[] | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  doc_type: string | null;
  content: string | null;
  created_at: string;
}

export interface KnowledgeBlock {
  id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
}

export interface MemoryExample {
  id: string;
  section_type: string;
  title: string;
  content: string;
  source: string | null;
  created_at: string;
}

export interface GeneratedSection {
  id: string;
  project_id: string;
  title: string;
  content: string | null;
  sources: SectionSource[] | null;
  section_order: number;
  status: 'pending' | 'generating' | 'generated' | 'edited';
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  market_type: string;
  market_object: string;
  criteria: Criterion[];
  expected_sections: string[];
  technical_requirements: string[];
  planning_constraints: string[];
  safety_requirements: string[];
  environmental_requirements: string[];
  resource_requirements: string[];
  specific_constraints: string[];
  key_warnings: string[];
}

export interface Criterion {
  name: string;
  weight: string | null;
  description: string;
}

export type SectionType =
  | 'presentation'
  | 'comprehension'
  | 'methodologie'
  | 'moyens_humains'
  | 'moyens_materiels'
  | 'planning'
  | 'qualite'
  | 'securite'
  | 'environnement'
  | 'references'
  | 'engagement'
  | 'autre';

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  presentation: 'Présentation',
  comprehension: 'Compréhension',
  methodologie: 'Méthodologie',
  moyens_humains: 'Moyens H.',
  moyens_materiels: 'Moyens M.',
  planning: 'Planning',
  qualite: 'Qualité',
  securite: 'Sécurité',
  environnement: 'Environnement',
  references: 'Références',
  engagement: 'Engagements',
  autre: 'Autre',
};

export interface OutlineSection {
  id: string;
  title: string;
  type: SectionType;
  description: string;
  key_points: string[];
  importance: 'haute' | 'moyenne' | 'basse';
}

export interface SectionSource {
  type: 'document' | 'knowledge' | 'example';
  name: string;
  excerpt: string;
}

export const DOCUMENT_TYPES = [
  { value: 'rc', label: 'RC (Règlement de Consultation)' },
  { value: 'cctp', label: 'CCTP (Cahier des Clauses Techniques)' },
  { value: 'ccap', label: 'CCAP (Cahier des Clauses Administratives)' },
  { value: 'dce', label: 'DCE (Dossier de Consultation)' },
  { value: 'planning', label: 'Planning' },
  { value: 'plans', label: 'Plans' },
  { value: 'annexes', label: 'Annexes' },
  { value: 'cadre_reponse', label: 'Cadre de réponse' },
  { value: 'other', label: 'Autre' },
] as const;

export const KNOWLEDGE_CATEGORIES = [
  { value: 'moyens_humains', label: 'Moyens humains' },
  { value: 'moyens_materiels', label: 'Moyens matériels' },
  { value: 'methodologie', label: 'Méthodologie' },
  { value: 'qualite', label: 'Qualité' },
  { value: 'securite', label: 'Sécurité' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'references', label: 'Références chantiers' },
  { value: 'process', label: 'Process chantier' },
  { value: 'entreprise', label: 'Présentation entreprise' },
  { value: 'certifications', label: 'Certifications & labels' },
] as const;
