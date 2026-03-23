'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2,
  ArrowRight,
  GripVertical,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import StepIndicator from '@/components/step-indicator';
import type { Project, OutlineSection, SectionType } from '@/types';
import { SECTION_TYPE_LABELS } from '@/types';

const IMPORTANCE_COLORS: Record<string, string> = {
  haute: 'bg-red-100 text-red-700',
  moyenne: 'bg-yellow-100 text-yellow-700',
  basse: 'bg-gray-100 text-gray-600',
};

export default function OutlinePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data.project);
        if (data.project.outline) {
          setSections(data.project.outline);
        }
      });
  }, [projectId]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setSections(newSections);
    saveOutline(newSections);
  };

  const deleteSection = (index: number) => {
    const newSections = sections.filter((_, i) => i !== index);
    setSections(newSections);
    saveOutline(newSections);
  };

  const startEdit = (section: OutlineSection) => {
    setEditingId(section.id);
    setEditTitle(section.title);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const newSections = sections.map((s) =>
      s.id === editingId ? { ...s, title: editTitle } : s
    );
    setSections(newSections);
    saveOutline(newSections);
    setEditingId(null);
  };

  const saveOutline = async (outline: OutlineSection[]) => {
    await fetch('/api/outline', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, outline }),
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      // Create pending sections and navigate immediately
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Navigate to draft page — it will trigger generation section by section
      router.push(`/projects/${projectId}/draft`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setGenerating(false);
    }
  };

  if (!project) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <StepIndicator current={3} />

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Trame du mémoire technique</h1>
        <p className="text-sm text-gray-500 mt-1">
          Réorganisez, renommez ou supprimez des sections avant la génération.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className="bg-white rounded-xl border border-gray-200 px-5 py-4 group"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-0.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveSection(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveSection(index, 'down')}
                  disabled={index === sections.length - 1}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <GripVertical className="h-5 w-5 text-gray-300 mt-0.5 shrink-0" />

              <div className="flex-1 min-w-0">
                {editingId === section.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                    />
                    <button onClick={saveEdit} className="text-green-600">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-6">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    {section.type && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {SECTION_TYPE_LABELS[section.type as SectionType] ?? section.type}
                      </span>
                    )}
                    {section.weight && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                        {section.weight} pts
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${IMPORTANCE_COLORS[section.importance]}`}
                    >
                      {section.importance}
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1 ml-8">{section.description}</p>

                {section.key_points.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                    {section.key_points.map((point, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded"
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEdit(section)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteSection(index)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <button
          onClick={handleGenerate}
          disabled={generating || sections.length === 0}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération du brouillon... (1-3 min)
            </>
          ) : (
            <>
              Générer le brouillon
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
