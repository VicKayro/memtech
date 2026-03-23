import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaude } from '@/lib/anthropic';
import { GENERATION_SYSTEM, generateSectionPrompt } from '@/lib/prompts';
import type { OutlineSection, SectionType } from '@/types';

export const maxDuration = 120; // 2 min per section max

export async function POST(req: Request) {
  const { section_id, project_id } = await req.json();

  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (!project?.outline || !project?.analysis) {
    return NextResponse.json({ error: 'Projet incomplet' }, { status: 400 });
  }

  // Get the section row
  const { data: sectionRow } = await supabase
    .from('generated_sections')
    .select('*')
    .eq('id', section_id)
    .single();

  if (!sectionRow) {
    return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
  }

  // Find the matching outline section
  const outline = project.outline as OutlineSection[];
  const sectionIndex = sectionRow.section_order - 1;
  const outlineSection = outline[sectionIndex];

  if (!outlineSection) {
    return NextResponse.json({ error: 'Section non trouvée dans la trame' }, { status: 400 });
  }

  // Mark as generating
  await supabase
    .from('generated_sections')
    .update({ status: 'generating' })
    .eq('id', section_id);

  try {
    // Get knowledge blocks and examples
    const [knowledgeRes, examplesRes] = await Promise.all([
      supabase.from('knowledge_blocks').select('*'),
      supabase.from('memory_examples').select('*'),
    ]);

    const knowledgeBlocks = knowledgeRes.data ?? [];
    const examples = examplesRes.data ?? [];

    // Find relevant content
    const relevantKnowledge = findRelevantContent(knowledgeBlocks, outlineSection, 'category');
    const relevantExamples = findRelevantContent(examples, outlineSection, 'section_type');

    const knowledgeText = relevantKnowledge
      .map((k) => `[${k.category} — ${k.title}]\n${k.content}`)
      .join('\n\n---\n\n');

    const examplesText = relevantExamples
      .map((e) => `[${e.section_type} — ${e.title}]\n${e.content}`)
      .join('\n\n---\n\n');

    const sectionType: SectionType = outlineSection.type || 'autre';
    const sectionWeight: number | null = outlineSection.weight ?? null;

    const content = await callClaude(
      GENERATION_SYSTEM,
      generateSectionPrompt(
        sectionRow.section_order,
        outlineSection.title,
        sectionType,
        outlineSection.description,
        outlineSection.key_points,
        outlineSection.importance,
        sectionWeight,
        outlineSection.criterion_ref ?? null,
        JSON.stringify(project.analysis, null, 2),
        knowledgeText,
        examplesText
      ),
      { maxTokens: 8192 }
    );

    // Build sources list
    const sources = [
      ...relevantKnowledge.map((k) => ({
        type: 'knowledge' as const,
        name: k.title,
        excerpt: k.content.slice(0, 100) + '...',
      })),
      ...relevantExamples.map((e) => ({
        type: 'example' as const,
        name: `${e.source ?? 'Exemple'} — ${e.title}`,
        excerpt: e.content.slice(0, 100) + '...',
      })),
    ];

    const { data, error } = await supabase
      .from('generated_sections')
      .update({
        content,
        sources,
        status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', section_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    // Mark as pending so it can be retried
    await supabase
      .from('generated_sections')
      .update({ status: 'pending' })
      .eq('id', section_id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur de génération' },
      { status: 500 }
    );
  }
}

// Simple relevance matching
function findRelevantContent<
  T extends { title: string; content: string; [key: string]: unknown },
>(items: T[], section: OutlineSection, typeField: string): T[] {
  const sectionWords = [section.title, section.description, ...section.key_points]
    .join(' ')
    .toLowerCase();

  const categoryMap: Record<string, string[]> = {
    compréhension: ['entreprise', 'references'],
    organisation: ['methodologie', 'process'],
    méthodologie: ['methodologie', 'process'],
    moyens: ['moyens_humains', 'moyens_materiels'],
    humains: ['moyens_humains'],
    matériels: ['moyens_materiels'],
    planning: ['process', 'methodologie'],
    phasage: ['process', 'methodologie'],
    qualité: ['qualite', 'certifications'],
    sécurité: ['securite'],
    environnement: ['environnement'],
    référence: ['references'],
    engagement: ['qualite', 'certifications'],
  };

  const matched = new Set<string>();
  for (const [keyword, categories] of Object.entries(categoryMap)) {
    if (sectionWords.includes(keyword)) {
      categories.forEach((c) => matched.add(c));
    }
  }

  return items.filter((item) => {
    const itemType = (item[typeField] as string)?.toLowerCase() ?? '';
    if (matched.size > 0 && matched.has(itemType)) return true;
    const itemText = `${item.title} ${item.content}`.toLowerCase();
    return sectionWords.split(' ').filter((w) => w.length > 4 && itemText.includes(w)).length >= 2;
  });
}
