'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import StepIndicator from '@/components/step-indicator';
import BriefSheet from '@/components/brief-sheet';
import type { Project, GeneratedSection, SectionSource } from '@/types';
import { generateDocx } from '@/lib/docx-export';

export default function DraftPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<GeneratedSection[]>([]);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [regenerating, setRegenerating] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  // Generation progress
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0, title: '' });
  const generatingRef = useRef(false);

  // Load project and sections
  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data.project);
        setSections(data.sections);

        // Auto-start generation if there are pending sections
        const pending = (data.sections as GeneratedSection[]).filter(
          (s) => s.status === 'pending'
        );
        if (pending.length > 0 && !generatingRef.current) {
          startGeneration(data.sections);
        }
      });
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGeneration = useCallback(
    async (currentSections: GeneratedSection[]) => {
      if (generatingRef.current) return;
      generatingRef.current = true;
      setGenerating(true);

      const pending = currentSections.filter((s) => s.status === 'pending');
      const total = currentSections.length;

      for (let i = 0; i < pending.length; i++) {
        const section = pending[i];
        const overallIndex = currentSections.findIndex((s) => s.id === section.id);

        setGenProgress({
          current: total - pending.length + i + 1,
          total,
          title: section.title,
        });

        // Update local state to show 'generating'
        setSections((prev) =>
          prev.map((s) =>
            s.id === section.id ? { ...s, status: 'generating' as const } : s
          )
        );

        try {
          const res = await fetch('/api/generate-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              section_id: section.id,
              project_id: projectId,
            }),
          });

          if (res.ok) {
            const generated = await res.json();
            setSections((prev) =>
              prev.map((s) => (s.id === section.id ? generated : s))
            );
          } else {
            // Mark as failed but continue with next sections
            const errData = await res.json().catch(() => ({ error: 'Erreur serveur' }));
            console.error(`Erreur section "${section.title}":`, errData.error);
            setSections((prev) =>
              prev.map((s) =>
                s.id === section.id
                  ? { ...s, status: 'pending' as const, content: `[Erreur: ${errData.error}]` }
                  : s
              )
            );
          }
        } catch (err) {
          console.error(`Erreur réseau section "${section.title}":`, err);
          setSections((prev) =>
            prev.map((s) =>
              s.id === section.id ? { ...s, status: 'pending' as const } : s
            )
          );
        }
      }

      // Mark project as generated
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'generated' }),
      });

      setGenerating(false);
      generatingRef.current = false;
    },
    [projectId]
  );

  const toggleSources = (id: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRegenerate = async (sectionId: string) => {
    setRegenerating((prev) => new Set(prev).add(sectionId));
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_id: sectionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? data : s))
        );
      }
    } finally {
      setRegenerating((prev) => {
        const next = new Set(prev);
        next.delete(sectionId);
        return next;
      });
    }
  };

  const handleCopyAll = () => {
    const text = buildExportMarkdown();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildExportMarkdown = (): string => {
    const name = project?.name ?? 'Projet';
    const date = new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const analysis = project?.analysis;

    let md = `# MÉMOIRE TECHNIQUE\n\n---\n\n`;
    md += `| | |\n|---|---|\n`;
    md += `| **Objet du marché** | ${name} |\n`;
    if (analysis?.market_object) md += `| **Description** | ${analysis.market_object} |\n`;
    if (analysis?.market_type) md += `| **Type de marché** | ${analysis.market_type} |\n`;
    md += `| **Maître d'ouvrage** | [À COMPLÉTER] |\n`;
    md += `| **Lot** | [À COMPLÉTER] |\n`;
    md += `| **Entreprise candidate** | [À COMPLÉTER] |\n`;
    md += `| **Date** | ${date} |\n\n---\n\n`;
    md += `## SOMMAIRE\n\n`;
    sections.forEach((s, i) => { md += `${i + 1}. ${s.title}\n`; });
    md += `\n---\n\n`;
    sections.forEach((s, i) => {
      md += `# ${i + 1}. ${s.title}\n\n${s.content ?? '[Section non générée]'}\n\n---\n\n`;
    });
    md += `# ANNEXES\n\n- Attestations de bonne exécution\n- Qualifications et certifications\n- Attestations d'assurance\n- CV des intervenants clés\n- Planning détaillé\n- Plan d'installation de chantier\n\n---\n\n*Document généré le ${date}*\n`;
    return md;
  };

  const handleExportMd = () => {
    const text = buildExportMarkdown();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoire-technique-${project?.name?.replace(/\s+/g, '-').toLowerCase() ?? 'draft'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportDocx = async () => {
    if (!project) return;
    setExportingDocx(true);
    try {
      const blob = await generateDocx({
        projectName: project.name,
        marketObject: project.analysis?.market_object ?? undefined,
        marketType: project.analysis?.market_type ?? undefined,
        sections: sections.map((s) => ({ title: s.title, content: s.content ?? '' })),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `memoire-technique-${project.name?.replace(/\s+/g, '-').toLowerCase() ?? 'draft'}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingDocx(false);
    }
  };

  if (!project) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  const generatedCount = sections.filter((s) => s.status === 'generated').length;
  const allGenerated = generatedCount === sections.length && sections.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator current={5} />

      {/* Generation progress banner */}
      {generating && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="font-medium text-blue-900">
              Génération en cours — section {genProgress.current}/{genProgress.total}
            </span>
          </div>
          <p className="text-sm text-blue-700 ml-8">
            {genProgress.title}
          </p>
          <div className="mt-3 ml-8 bg-blue-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${(genProgress.current / genProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-blue-500 mt-1 ml-8">
            ~{Math.max(0, genProgress.total - genProgress.current)} section{genProgress.total - genProgress.current > 1 ? 's' : ''} restante{genProgress.total - genProgress.current > 1 ? 's' : ''} • Les sections apparaissent au fur et à mesure
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Brouillon du mémoire technique</h1>
          <p className="text-sm text-gray-500 mt-1">
            {project.name} — {generatedCount}/{sections.length} sections générées
          </p>
        </div>
        {allGenerated && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button
              onClick={handleExportMd}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              .md
            </button>
            <button
              onClick={handleExportDocx}
              disabled={exportingDocx}
              className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {exportingDocx ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Exporter .docx
            </button>
          </div>
        )}
      </div>

      {/* Brief Sheet — shows remaining placeholders */}
      {allGenerated && <BriefSheet sections={sections} />}

      <div className="space-y-6">
        {sections.map((section, index) => {
          const isRegenerating = regenerating.has(section.id);
          const sources = (section.sources ?? []) as SectionSource[];
          const showSources = expandedSources.has(section.id);
          const isGenerating = section.status === 'generating' || isRegenerating;

          return (
            <div
              key={section.id}
              className={`bg-white rounded-xl border overflow-hidden transition-colors ${
                isGenerating ? 'border-blue-200' : 'border-gray-200'
              }`}
            >
              {/* Section header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-lg ${
                      section.status === 'generated'
                        ? 'text-green-600 bg-green-50'
                        : isGenerating
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-400 bg-gray-50'
                    }`}
                  >
                    {section.status === 'generated' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      (index + 1).toString().padStart(2, '0')
                    )}
                  </span>
                  <h2 className="font-semibold text-gray-900">{section.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isGenerating ? (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Génération...
                    </span>
                  ) : section.status === 'generated' ? (
                    <button
                      onClick={() => handleRegenerate(section.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Régénérer
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">En attente</span>
                  )}
                </div>
              </div>

              {/* Section content */}
              <div className="px-6 py-5">
                {section.content ? (
                  <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-table:text-xs prose-th:bg-gray-50 prose-th:font-semibold prose-th:text-gray-700 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-1.5 prose-td:border-gray-200 prose-strong:text-gray-900 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {isGenerating ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rédaction en cours...
                      </div>
                    ) : (
                      'En attente de génération'
                    )}
                  </div>
                )}
              </div>

              {/* Sources */}
              {sources.length > 0 && (
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => toggleSources(section.id)}
                    className="w-full px-6 py-3 flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      {sources.length} source{sources.length > 1 ? 's' : ''}
                    </span>
                    {showSources ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {showSources && (
                    <div className="px-6 pb-4 space-y-2">
                      {sources.map((src, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                src.type === 'knowledge'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {src.type === 'knowledge' ? 'Base interne' : 'Exemple'}
                            </span>
                            <span className="text-xs font-medium text-gray-700">{src.name}</span>
                          </div>
                          <p className="text-[11px] text-gray-400">{src.excerpt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
