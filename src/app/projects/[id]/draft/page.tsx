'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data.project);
        setSections(data.sections);
      });
  }, [projectId]);

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

    // Page de garde
    let md = '';
    md += `# MÉMOIRE TECHNIQUE\n\n`;
    md += `---\n\n`;
    md += `| | |\n`;
    md += `|---|---|\n`;
    md += `| **Objet du marché** | ${name} |\n`;
    if (analysis?.market_object) {
      md += `| **Description** | ${analysis.market_object} |\n`;
    }
    if (analysis?.market_type) {
      md += `| **Type de marché** | ${analysis.market_type} |\n`;
    }
    md += `| **Maître d'ouvrage** | [À COMPLÉTER] |\n`;
    md += `| **Lot** | [À COMPLÉTER] |\n`;
    md += `| **Entreprise candidate** | [À COMPLÉTER] |\n`;
    md += `| **Date** | ${date} |\n`;
    md += `\n---\n\n`;

    // Sommaire
    md += `## SOMMAIRE\n\n`;
    sections.forEach((s, i) => {
      md += `${i + 1}. ${s.title}\n`;
    });
    md += `\n---\n\n`;

    // Sections
    sections.forEach((s, i) => {
      md += `# ${i + 1}. ${s.title}\n\n`;
      md += `${s.content ?? '[Section non générée]'}\n\n`;
      if (i < sections.length - 1) {
        md += `---\n\n`;
      }
    });

    // Annexes
    md += `\n---\n\n`;
    md += `# ANNEXES\n\n`;
    md += `- Attestations de bonne exécution\n`;
    md += `- Qualifications et certifications\n`;
    md += `- Attestations d'assurance (RC et décennale)\n`;
    md += `- CV des intervenants clés\n`;
    md += `- Planning détaillé\n`;
    md += `- Plan d'installation de chantier\n`;
    md += `\n---\n\n`;
    md += `*Document généré le ${date} — à compléter et personnaliser avant soumission.*\n`;

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
        sections: sections.map((s) => ({
          title: s.title,
          content: s.content ?? '',
        })),
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

  const allGenerated = sections.every((s) => s.status === 'generated');

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator current={4} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Brouillon du mémoire technique</h1>
          <p className="text-sm text-gray-500 mt-1">
            {project.name} — {sections.length} sections
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
              {copied ? 'Copié !' : 'Copier tout'}
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

      <div className="space-y-6">
        {sections.map((section, index) => {
          const isRegenerating = regenerating.has(section.id);
          const sources = (section.sources ?? []) as SectionSource[];
          const showSources = expandedSources.has(section.id);

          return (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Section header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 w-7 h-7 flex items-center justify-center rounded-lg">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <h2 className="font-semibold text-gray-900">{section.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  {section.status === 'generating' || isRegenerating ? (
                    <span className="flex items-center gap-1.5 text-xs text-yellow-600">
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

              {/* Section content — rendered as Markdown */}
              <div className="px-6 py-5">
                {section.content ? (
                  <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-table:text-xs prose-th:bg-gray-50 prose-th:font-semibold prose-th:text-gray-700 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-1.5 prose-td:border-gray-200 prose-strong:text-gray-900 prose-li:my-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {section.status === 'generating'
                      ? 'Génération en cours...'
                      : 'En attente de génération'}
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
                      {sources.length} source{sources.length > 1 ? 's' : ''} utilisée{sources.length > 1 ? 's' : ''}
                    </span>
                    {showSources ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {showSources && (
                    <div className="px-6 pb-4 space-y-2">
                      {sources.map((src, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-lg px-3 py-2"
                        >
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
                            <span className="text-xs font-medium text-gray-700">
                              {src.name}
                            </span>
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
