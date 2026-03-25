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
  norms_cited: string[];
  page_limit: number | null;
  page_format: string | null;
}

// ---------------------------------------------------------------------------
// Company Profile
// ---------------------------------------------------------------------------

export interface CompanyInfo {
  name: string;
  legal_form: string;
  siret: string;
  address: string;
  creation_date: string;
  headcount: number | null;
  revenue_n1: string;
  revenue_n2: string;
  revenue_n3: string;
  activity_description: string;
  insurance_rc: string;
  insurance_decennale: string;
}

export interface PersonnelMember {
  id: string;
  name: string;
  role: string;
  qualifications: string[];
  experience_years: number | null;
  certifications: string[];
  availability: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  characteristics: string;
  quantity: number;
  ownership: 'propre' | 'location' | 'sous-traitance';
  last_inspection: string;
}

export interface Supplier {
  id: string;
  name: string;
  specialty: string;
  location: string;
  certifications: string[];
}

export interface ProjectReference {
  id: string;
  name: string;
  client: string;
  nature: string;
  amount_ht: string;
  year: string;
  duration: string;
  similarities: string;
  contact_name: string;
  contact_phone: string;
}

export interface Certification {
  id: string;
  name: string;
  reference: string;
  organism: string;
  validity: string;
}

export interface SafetyIndicators {
  tf: string;
  tg: string;
  nb_accidents_n1: string;
  nb_accidents_n2: string;
  sst_count: string;
  safety_budget: string;
}

export interface CompanyProfile {
  id: string;
  is_default: boolean;
  company_info: CompanyInfo;
  personnel: PersonnelMember[];
  equipment: EquipmentItem[];
  suppliers: Supplier[];
  project_references: ProjectReference[];
  certifications: Certification[];
  safety_indicators: SafetyIndicators;
  created_at: string;
  updated_at: string;
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
  criterion_ref: string | null;
  weight: number | null;
  description: string;
  key_points: string[];
  importance: 'haute' | 'moyenne' | 'basse';
}

export interface SectionSource {
  type: 'document' | 'knowledge' | 'example';
  name: string;
  excerpt: string;
}

// ---------------------------------------------------------------------------
// Bible de prix (Phase 1)
// ---------------------------------------------------------------------------

export interface PriceItem {
  id: string;
  category: string;
  subcategory: string | null;
  designation: string;
  unit: string;
  unit_price: number | null;
  source_project: string | null;
  source_year: string | null;
  notes: string | null;
  carbon_kg_per_unit: number | null;
  created_at: string;
}

export const PRICE_CATEGORIES = [
  { value: 'gros_oeuvre', label: 'Gros œuvre' },
  { value: 'second_oeuvre', label: 'Second œuvre' },
  { value: 'vrd', label: 'VRD' },
  { value: 'cvc', label: 'CVC / Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'peinture', label: 'Peinture / Revêtements' },
  { value: 'etancheite', label: 'Étanchéité / Couverture' },
  { value: 'demolition', label: 'Démolition / Désamiantage' },
  { value: 'terrassement', label: 'Terrassement' },
  { value: 'charpente', label: 'Charpente / Structure' },
  { value: 'autre', label: 'Autre' },
] as const;

export const PRICE_UNITS = [
  'm³', 'm²', 'ml', 'u', 'kg', 't', 'forfait', 'h', 'j', 'ens',
] as const;

// ---------------------------------------------------------------------------
// Comparaison de devis (Phase 2)
// ---------------------------------------------------------------------------

export interface QuoteSupplier {
  name: string;
  file_name: string;
}

export interface QuoteLineItem {
  designation: string;
  unit: string;
  qty: number | null;
  prices: Record<string, number | null>; // supplier name → price
}

export interface QuoteComparison {
  id: string;
  project_id: string | null;
  name: string;
  suppliers: QuoteSupplier[];
  line_items: QuoteLineItem[];
  status: 'pending' | 'analyzing' | 'done';
  created_at: string;
}

// ---------------------------------------------------------------------------
// Chiffrage rapide / Estimation (Phase 3)
// ---------------------------------------------------------------------------

export interface EstimateLineItem {
  price_item_id: string | null;
  designation: string;
  unit: string;
  qty: number;
  unit_price: number;
  total: number;
  carbon_kg_per_unit?: number | null;
}

export interface ProjectEstimate {
  id: string;
  project_id: string;
  line_items: EstimateLineItem[];
  total_ht: number | null;
  created_at: string;
  updated_at: string;
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
