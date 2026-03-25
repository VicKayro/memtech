'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Plus, FolderOpen, Clock, ChevronRight, FileText,
  Building2, BookOpen, Scale, ArrowRight, CheckCircle2, Circle,
} from 'lucide-react';
import type { Project } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  uploaded: { label: 'Documents uploadés', color: 'bg-gray-100 text-gray-600' },
  analyzing: { label: 'Analyse en cours...', color: 'bg-yellow-100 text-yellow-700' },
  analyzed: { label: 'Analysé', color: 'bg-blue-100 text-blue-700' },
  outlined: { label: 'Trame prête', color: 'bg-indigo-100 text-indigo-700' },
  generating: { label: 'Génération...', color: 'bg-yellow-100 text-yellow-700' },
  generated: { label: 'Brouillon prêt', color: 'bg-green-100 text-green-700' },
};

interface SetupState {
  hasCompany: boolean;
  hasPrices: boolean;
  hasKnowledge: boolean;
  projectCount: number;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState<SetupState>({
    hasCompany: false, hasPrices: false, hasKnowledge: false, projectCount: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/company').then((r) => r.json()).catch(() => null),
      fetch('/api/prices?search=').then((r) => r.json()).catch(() => []),
      fetch('/api/knowledge').then((r) => r.json()).catch(() => []),
    ]).then(([projectsData, company, prices, knowledge]) => {
      const p = Array.isArray(projectsData) ? projectsData : [];
      setProjects(p);
      setSetup({
        hasCompany: !!(company?.company_info?.name),
        hasPrices: Array.isArray(prices) && prices.length > 0,
        hasKnowledge: Array.isArray(knowledge) && knowledge.length > 0,
        projectCount: p.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const setupSteps = [
    { done: setup.hasCompany, label: 'Configurer votre entreprise', desc: 'Personnel, matériel, références, certifications', href: '/company', icon: Building2 },
    { done: setup.hasPrices, label: 'Importer vos premiers prix', desc: 'Importez un ancien DPGF pour construire votre base', href: '/prices', icon: BookOpen },
    { done: setup.hasKnowledge, label: 'Ajouter du contenu interne', desc: 'Méthodologie, process, textes types...', href: '/knowledge', icon: FileText },
  ];
  const setupDone = setupSteps.filter((s) => s.done).length;
  const allSetup = setupDone === setupSteps.length;

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  return (
    <div>
      {/* Onboarding — only if not fully configured */}
      {!allSetup && (
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bienvenue sur MemTech</h2>
              <p className="text-sm text-gray-500 mt-0.5">Configurez votre espace pour des mémoires techniques plus précis</p>
            </div>
            <div className="text-sm font-medium text-blue-600">
              {setupDone}/{setupSteps.length} terminé
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-blue-100 rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${(setupDone / setupSteps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2">
            {setupSteps.map((step) => (
              <Link
                key={step.label}
                href={step.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  step.done
                    ? 'bg-white/50 opacity-60'
                    : 'bg-white hover:shadow-sm hover:border-blue-200 border border-transparent'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
                {!step.done && (
                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions — always visible */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <Link
          href="/projects/new"
          className="flex items-center gap-3 bg-blue-600 text-white px-5 py-4 rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <div>
            <div className="font-semibold text-sm">Nouveau projet</div>
            <div className="text-xs text-blue-200">Répondre à un AO</div>
          </div>
        </Link>
        <Link
          href="/quotes"
          className="flex items-center gap-3 bg-white border border-gray-200 text-gray-700 px-5 py-4 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <Scale className="h-5 w-5 text-indigo-500" />
          <div>
            <div className="font-semibold text-sm">Comparer des devis</div>
            <div className="text-xs text-gray-400">Upload 2-5 devis PDF</div>
          </div>
        </Link>
        <Link
          href="/prices"
          className="flex items-center gap-3 bg-white border border-gray-200 text-gray-700 px-5 py-4 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <BookOpen className="h-5 w-5 text-amber-500" />
          <div>
            <div className="font-semibold text-sm">Bible de prix</div>
            <div className="text-xs text-gray-400">Gérer vos prix historiques</div>
          </div>
        </Link>
      </div>

      {/* Projects List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Mes projets</h2>
        {projects.length > 0 && (
          <span className="text-sm text-gray-400">{projects.length} dossier{projects.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucun projet pour l&apos;instant</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            Créez votre premier projet pour générer un mémoire technique.
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Créer un projet
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.uploaded;
            const href =
              p.status === 'generated'
                ? `/projects/${p.id}/draft`
                : p.status === 'outlined'
                  ? `/projects/${p.id}/outline`
                  : `/projects/${p.id}`;

            return (
              <Link
                key={p.id}
                href={href}
                className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-6 py-4 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {new Date(p.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {p.market_type && (
                        <span className="text-xs text-gray-400">
                          — {p.market_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
