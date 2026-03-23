'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2, Users, Wrench, Truck, FolderOpen, Award, ShieldCheck,
  Plus, Trash2, Save, Loader2, CheckCircle,
} from 'lucide-react';
import type {
  CompanyProfile, CompanyInfo, PersonnelMember, EquipmentItem,
  Supplier, ProjectReference, Certification, SafetyIndicators,
} from '@/types';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const EMPTY_INFO: CompanyInfo = {
  name: '', legal_form: '', siret: '', address: '', creation_date: '',
  headcount: null, revenue_n1: '', revenue_n2: '', revenue_n3: '',
  activity_description: '', insurance_rc: '', insurance_decennale: '',
};

const EMPTY_SAFETY: SafetyIndicators = {
  tf: '', tg: '', nb_accidents_n1: '', nb_accidents_n2: '',
  sst_count: '', safety_budget: '',
};

function uid() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'identity', label: 'Identité', icon: Building2 },
  { key: 'personnel', label: 'Personnel', icon: Users },
  { key: 'equipment', label: 'Matériel', icon: Wrench },
  { key: 'suppliers', label: 'Fournisseurs', icon: Truck },
  { key: 'references', label: 'Références', icon: FolderOpen },
  { key: 'certifications', label: 'Certifications', icon: Award },
  { key: 'safety', label: 'Sécurité', icon: ShieldCheck },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompanyPage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<TabKey>('identity');

  // Local state for each section
  const [info, setInfo] = useState<CompanyInfo>(EMPTY_INFO);
  const [personnel, setPersonnel] = useState<PersonnelMember[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [references, setReferences] = useState<ProjectReference[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [safety, setSafety] = useState<SafetyIndicators>(EMPTY_SAFETY);

  // Load
  useEffect(() => {
    fetch('/api/company')
      .then((r) => r.json())
      .then((data: CompanyProfile | null) => {
        if (data) {
          setProfile(data);
          setInfo(data.company_info ?? EMPTY_INFO);
          setPersonnel(data.personnel ?? []);
          setEquipment(data.equipment ?? []);
          setSuppliers(data.suppliers ?? []);
          setReferences(data.project_references ?? []);
          setCertifications(data.certifications ?? []);
          setSafety(data.safety_indicators ?? EMPTY_SAFETY);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    const body = {
      company_info: info,
      personnel,
      equipment,
      suppliers,
      project_references: references,
      certifications,
      safety_indicators: safety,
    };

    const method = profile ? 'PUT' : 'POST';
    const res = await fetch('/api/company', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }, [info, personnel, equipment, suppliers, references, certifications, safety, profile]);

  // ---------------------------------------------------------------------------
  // Completion indicator
  // ---------------------------------------------------------------------------

  const completionScore = (() => {
    let filled = 0;
    let total = 7;
    if (info.name && info.siret) filled++;
    if (personnel.length > 0) filled++;
    if (equipment.length > 0) filled++;
    if (suppliers.length > 0) filled++;
    if (references.length > 0) filled++;
    if (certifications.length > 0) filled++;
    if (safety.tf || safety.tg) filled++;
    return Math.round((filled / total) * 100);
  })();

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profil entreprise</h1>
          <p className="text-gray-500 mt-1">
            Ces données seront injectées dans la génération des mémoires techniques.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </div>

      {/* Completion bar */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Complétion du profil</span>
          <span className="text-sm font-bold text-blue-600">{completionScore}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${completionScore}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {tab === 'identity' && (
          <IdentityTab info={info} onChange={setInfo} />
        )}
        {tab === 'personnel' && (
          <PersonnelTab items={personnel} onChange={setPersonnel} />
        )}
        {tab === 'equipment' && (
          <EquipmentTab items={equipment} onChange={setEquipment} />
        )}
        {tab === 'suppliers' && (
          <SuppliersTab items={suppliers} onChange={setSuppliers} />
        )}
        {tab === 'references' && (
          <ReferencesTab items={references} onChange={setReferences} />
        )}
        {tab === 'certifications' && (
          <CertificationsTab items={certifications} onChange={setCertifications} />
        )}
        {tab === 'safety' && (
          <SafetyTab indicators={safety} onChange={setSafety} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared field component
// ---------------------------------------------------------------------------

function Field({ label, value, onChange, placeholder, type = 'text', rows }: {
  label: string; value: string | number | null; onChange: (v: string) => void;
  placeholder?: string; type?: string; rows?: number;
}) {
  const val = value === null || value === undefined ? '' : String(value);
  const cls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {rows ? (
        <textarea value={val} onChange={(e) => onChange(e.target.value)} rows={rows}
          placeholder={placeholder} className={`${cls} resize-none`} />
      ) : (
        <input type={type} value={val} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Identity Tab
// ---------------------------------------------------------------------------

function IdentityTab({ info, onChange }: { info: CompanyInfo; onChange: (i: CompanyInfo) => void }) {
  const set = (key: keyof CompanyInfo, val: string) =>
    onChange({ ...info, [key]: key === 'headcount' ? (val ? Number(val) : null) : val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Raison sociale" value={info.name} onChange={(v) => set('name', v)} placeholder="Ex : BTP France SAS" />
      <Field label="Forme juridique" value={info.legal_form} onChange={(v) => set('legal_form', v)} placeholder="SAS, SARL, SA..." />
      <Field label="SIRET" value={info.siret} onChange={(v) => set('siret', v)} placeholder="123 456 789 00012" />
      <Field label="Date de création" value={info.creation_date} onChange={(v) => set('creation_date', v)} placeholder="2005" />
      <div className="md:col-span-2">
        <Field label="Adresse du siège" value={info.address} onChange={(v) => set('address', v)} placeholder="12 rue des Bâtisseurs, 75001 Paris" />
      </div>
      <Field label="Effectif global" value={info.headcount} onChange={(v) => set('headcount', v)} type="number" placeholder="85" />
      <Field label="CA N-1" value={info.revenue_n1} onChange={(v) => set('revenue_n1', v)} placeholder="12 500 000 €" />
      <Field label="CA N-2" value={info.revenue_n2} onChange={(v) => set('revenue_n2', v)} placeholder="11 800 000 €" />
      <Field label="CA N-3" value={info.revenue_n3} onChange={(v) => set('revenue_n3', v)} placeholder="10 200 000 €" />
      <div className="md:col-span-2">
        <Field label="Description de l'activité" value={info.activity_description} onChange={(v) => set('activity_description', v)} rows={3} placeholder="Entreprise générale de bâtiment spécialisée en..." />
      </div>
      <Field label="Assurance RC Professionnelle" value={info.insurance_rc} onChange={(v) => set('insurance_rc', v)} placeholder="AXA n°123456" />
      <Field label="Assurance Décennale" value={info.insurance_decennale} onChange={(v) => set('insurance_decennale', v)} placeholder="SMABTP n°789012" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Personnel Tab
// ---------------------------------------------------------------------------

function PersonnelTab({ items, onChange }: { items: PersonnelMember[]; onChange: (i: PersonnelMember[]) => void }) {
  const add = () => onChange([...items, {
    id: uid(), name: '', role: '', qualifications: [], experience_years: null,
    certifications: [], availability: '',
  }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, key: keyof PersonnelMember, val: unknown) =>
    onChange(items.map((i) => i.id === id ? { ...i, [key]: val } : i));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} membre{items.length !== 1 ? 's' : ''}</p>
        <button onClick={add} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
      <div className="space-y-4">
        {items.map((p) => (
          <div key={p.id} className="border border-gray-200 rounded-lg p-4 relative group">
            <button onClick={() => remove(p.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Nom" value={p.name} onChange={(v) => update(p.id, 'name', v)} placeholder="Jean Dupont" />
              <Field label="Fonction" value={p.role} onChange={(v) => update(p.id, 'role', v)} placeholder="Conducteur de travaux" />
              <Field label="Expérience (années)" value={p.experience_years} onChange={(v) => update(p.id, 'experience_years', v ? Number(v) : null)} type="number" />
              <Field label="Qualifications (séparées par virgule)" value={p.qualifications.join(', ')} onChange={(v) => update(p.id, 'qualifications', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="CACES R489, Habilitation B1V" />
              <Field label="Certifications" value={p.certifications.join(', ')} onChange={(v) => update(p.id, 'certifications', v.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="SST, AIPR" />
              <Field label="Disponibilité" value={p.availability} onChange={(v) => update(p.id, 'availability', v)} placeholder="100% dédié chantier" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equipment Tab
// ---------------------------------------------------------------------------

function EquipmentTab({ items, onChange }: { items: EquipmentItem[]; onChange: (i: EquipmentItem[]) => void }) {
  const add = () => onChange([...items, {
    id: uid(), name: '', characteristics: '', quantity: 1,
    ownership: 'propre', last_inspection: '',
  }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, key: keyof EquipmentItem, val: unknown) =>
    onChange(items.map((i) => i.id === id ? { ...i, [key]: val } : i));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} engin{items.length !== 1 ? 's' : ''}</p>
        <button onClick={add} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
      <div className="space-y-4">
        {items.map((e) => (
          <div key={e.id} className="border border-gray-200 rounded-lg p-4 relative group">
            <button onClick={() => remove(e.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Nom / Type" value={e.name} onChange={(v) => update(e.id, 'name', v)} placeholder="Pelle hydraulique CAT 320" />
              <Field label="Caractéristiques" value={e.characteristics} onChange={(v) => update(e.id, 'characteristics', v)} placeholder="20T, portée 10m" />
              <Field label="Quantité" value={e.quantity} onChange={(v) => update(e.id, 'quantity', Number(v) || 1)} type="number" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Propriété</label>
                <select value={e.ownership} onChange={(ev) => update(e.id, 'ownership', ev.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="propre">Propre</option>
                  <option value="location">Location</option>
                  <option value="sous-traitance">Sous-traitance</option>
                </select>
              </div>
              <Field label="Dernier contrôle" value={e.last_inspection} onChange={(v) => update(e.id, 'last_inspection', v)} placeholder="2025-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suppliers Tab
// ---------------------------------------------------------------------------

function SuppliersTab({ items, onChange }: { items: Supplier[]; onChange: (i: Supplier[]) => void }) {
  const add = () => onChange([...items, { id: uid(), name: '', specialty: '', location: '', certifications: [] }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, key: keyof Supplier, val: unknown) =>
    onChange(items.map((i) => i.id === id ? { ...i, [key]: val } : i));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} fournisseur{items.length !== 1 ? 's' : ''}</p>
        <button onClick={add} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
      <div className="space-y-4">
        {items.map((s) => (
          <div key={s.id} className="border border-gray-200 rounded-lg p-4 relative group">
            <button onClick={() => remove(s.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom" value={s.name} onChange={(v) => update(s.id, 'name', v)} placeholder="Point P" />
              <Field label="Spécialité" value={s.specialty} onChange={(v) => update(s.id, 'specialty', v)} placeholder="Matériaux gros œuvre" />
              <Field label="Localisation" value={s.location} onChange={(v) => update(s.id, 'location', v)} placeholder="Pontarlier (25)" />
              <Field label="Certifications (séparées par virgule)" value={s.certifications.join(', ')} onChange={(v) => update(s.id, 'certifications', v.split(',').map((x: string) => x.trim()).filter(Boolean))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// References Tab
// ---------------------------------------------------------------------------

function ReferencesTab({ items, onChange }: { items: ProjectReference[]; onChange: (i: ProjectReference[]) => void }) {
  const add = () => onChange([...items, {
    id: uid(), name: '', client: '', nature: '', amount_ht: '',
    year: '', duration: '', similarities: '', contact_name: '', contact_phone: '',
  }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, key: keyof ProjectReference, val: string) =>
    onChange(items.map((i) => i.id === id ? { ...i, [key]: val } : i));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} référence{items.length !== 1 ? 's' : ''}</p>
        <button onClick={add} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
      <div className="space-y-4">
        {items.map((r) => (
          <div key={r.id} className="border border-gray-200 rounded-lg p-4 relative group">
            <button onClick={() => remove(r.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Field label="Nom du chantier" value={r.name} onChange={(v) => update(r.id, 'name', v)} placeholder="Réhabilitation groupe scolaire" />
              <Field label="Maître d'ouvrage" value={r.client} onChange={(v) => update(r.id, 'client', v)} placeholder="Ville de Morteau" />
              <Field label="Nature des travaux" value={r.nature} onChange={(v) => update(r.id, 'nature', v)} placeholder="Menuiseries ext. bois" />
              <Field label="Montant HT" value={r.amount_ht} onChange={(v) => update(r.id, 'amount_ht', v)} placeholder="450 000 €" />
              <Field label="Année" value={r.year} onChange={(v) => update(r.id, 'year', v)} placeholder="2024" />
              <Field label="Durée" value={r.duration} onChange={(v) => update(r.id, 'duration', v)} placeholder="8 mois" />
              <div className="md:col-span-3">
                <Field label="Similarité avec le marché" value={r.similarities} onChange={(v) => update(r.id, 'similarities', v)} rows={2} placeholder="Contexte similaire : site occupé, menuiseries bois performantes..." />
              </div>
              <Field label="Contact référent" value={r.contact_name} onChange={(v) => update(r.id, 'contact_name', v)} placeholder="M. Martin, DGS" />
              <Field label="Téléphone" value={r.contact_phone} onChange={(v) => update(r.id, 'contact_phone', v)} placeholder="03 81 XX XX XX" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Certifications Tab
// ---------------------------------------------------------------------------

function CertificationsTab({ items, onChange }: { items: Certification[]; onChange: (i: Certification[]) => void }) {
  const add = () => onChange([...items, { id: uid(), name: '', reference: '', organism: '', validity: '' }]);
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));
  const update = (id: string, key: keyof Certification, val: string) =>
    onChange(items.map((i) => i.id === id ? { ...i, [key]: val } : i));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{items.length} certification{items.length !== 1 ? 's' : ''}</p>
        <button onClick={add} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
      <div className="space-y-4">
        {items.map((c) => (
          <div key={c.id} className="border border-gray-200 rounded-lg p-4 relative group">
            <button onClick={() => remove(c.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Nom" value={c.name} onChange={(v) => update(c.id, 'name', v)} placeholder="Qualibat 2112" />
              <Field label="N° / Référence" value={c.reference} onChange={(v) => update(c.id, 'reference', v)} placeholder="E-12345" />
              <Field label="Organisme" value={c.organism} onChange={(v) => update(c.id, 'organism', v)} placeholder="Qualibat" />
              <Field label="Validité" value={c.validity} onChange={(v) => update(c.id, 'validity', v)} placeholder="2027-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Safety Tab
// ---------------------------------------------------------------------------

function SafetyTab({ indicators, onChange }: { indicators: SafetyIndicators; onChange: (i: SafetyIndicators) => void }) {
  const set = (key: keyof SafetyIndicators, val: string) => onChange({ ...indicators, [key]: val });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Taux de fréquence (TF)" value={indicators.tf} onChange={(v) => set('tf', v)} placeholder="12.5" />
      <Field label="Taux de gravité (TG)" value={indicators.tg} onChange={(v) => set('tg', v)} placeholder="0.8" />
      <Field label="Nb accidents avec arrêt N-1" value={indicators.nb_accidents_n1} onChange={(v) => set('nb_accidents_n1', v)} placeholder="2" />
      <Field label="Nb accidents avec arrêt N-2" value={indicators.nb_accidents_n2} onChange={(v) => set('nb_accidents_n2', v)} placeholder="3" />
      <Field label="Nombre de SST" value={indicators.sst_count} onChange={(v) => set('sst_count', v)} placeholder="8" />
      <Field label="Budget sécurité annuel" value={indicators.safety_budget} onChange={(v) => set('safety_budget', v)} placeholder="45 000 €" />
    </div>
  );
}
