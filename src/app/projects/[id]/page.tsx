'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Target,
  Shield,
  Leaf,
  Users,
  Clock,
  Wrench,
} from 'lucide-react';
import StepIndicator from '@/components/step-indicator';
import type { Project, Document, Analysis } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
  technical_requirements: <Wrench className="h-4 w-4 text-blue-500" />,
  planning_constraints: <Clock className="h-4 w-4 text-orange-500" />,
  safety_requirements: <Shield className="h-4 w-4 text-red-500" />,
  environmental_requirements: <Leaf className="h-4 w-4 text-green-500" />,
  resource_requirements: <Users className="h-4 w-4 text-purple-500" />,
  specific_constraints: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  key_warnings: <AlertTriangle className="h-4 w-4 text-red-500" />,
};

const SECTION_LABELS: Record<string, string> = {
  technical_requirements: 'Exigences techniques',
  planning_constraints: 'Contraintes de planning',
  safety_requirements: 'Sécurité',
  environmental_requirements: 'Environnement',
  resource_requirements: 'Moyens demandés',
  specific_constraints: 'Contraintes spécifiques',
  key_warnings: 'Points de vigilance',
};

export default function ProjectAnalysis() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data.project);
        setDocuments(data.documents);
      });
  }, [projectId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateOutline = async () => {
    setGeneratingOutline(true);
    setError('');
    try {
      const res = await fetch('/api/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/projects/${projectId}/outline`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setGeneratingOutline(false);
    }
  };

  if (!project) {
    return (
      <div className="text-center py-20 text-gray-400">Chargement...</div>
    );
  }

  const analysis = project.analysis as Analysis | null;
  const isAnalyzed = !!analysis;

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator current={2} />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {documents.length} document{documents.length > 1 ? 's' : ''} dans le dossier
        </p>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Documents du dossier</h2>
        <div className="grid grid-cols-2 gap-2">
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2"
            >
              <FileText className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="truncate">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Analysis button or results */}
      {!isAnalyzed ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Target className="mx-auto h-10 w-10 text-blue-500 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Analyser le dossier
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            L&apos;IA va lire vos documents et extraire les critères de notation,
            exigences techniques, contraintes et points de vigilance.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse en cours... (30-60s)
              </>
            ) : (
              <>
                Lancer l&apos;analyse
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Analysis results */}
          <div className="space-y-4">
            {/* Market info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Type de marché</h2>
                  <p className="text-lg font-bold text-blue-600 capitalize mt-0.5">
                    {analysis.market_type}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600">{analysis.market_object}</p>
            </div>

            {/* Criteria */}
            {analysis.criteria.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Critères de notation
                </h2>
                <div className="space-y-2">
                  {analysis.criteria.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between bg-blue-50 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                      </div>
                      {c.weight && (
                        <span className="text-sm font-bold text-blue-600 shrink-0 ml-4">
                          {c.weight}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(SECTION_LABELS).map(([key, label]) => {
                const items = analysis[key as keyof Analysis] as string[];
                if (!items || items.length === 0) return null;
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      {ICON_MAP[key]}
                      {label}
                    </h2>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Expected sections */}
            {analysis.expected_sections.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Sections attendues dans le mémoire
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analysis.expected_sections.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate outline button */}
          <div className="mt-8 text-center">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}
            <button
              onClick={handleGenerateOutline}
              disabled={generatingOutline}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generatingOutline ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération de la trame...
                </>
              ) : (
                <>
                  Proposer une trame de mémoire
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
