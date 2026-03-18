'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, Clock, ChevronRight, FileText } from 'lucide-react';
import type { Project } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  uploaded: { label: 'Documents uploadés', color: 'bg-gray-100 text-gray-600' },
  analyzing: { label: 'Analyse en cours...', color: 'bg-yellow-100 text-yellow-700' },
  analyzed: { label: 'Analysé', color: 'bg-blue-100 text-blue-700' },
  outlined: { label: 'Trame prête', color: 'bg-indigo-100 text-indigo-700' },
  generating: { label: 'Génération...', color: 'bg-yellow-100 text-yellow-700' },
  generated: { label: 'Brouillon prêt', color: 'bg-green-100 text-green-700' },
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dossiers d&apos;appels d&apos;offres</h1>
          <p className="text-gray-500 mt-1">
            Créez un dossier, uploadez les pièces, générez votre mémoire technique.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau dossier
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Chargement...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Aucun dossier pour l&apos;instant</p>
          <p className="text-gray-400 text-sm mt-1">
            Créez votre premier dossier d&apos;appel d&apos;offres pour commencer.
          </p>
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
