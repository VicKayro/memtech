import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaude } from '@/lib/anthropic';
import { GENERATION_SYSTEM, generateSectionPrompt } from '@/lib/prompts';
import type { OutlineSection, SectionType } from '@/types';

export const maxDuration = 300; // 5 min for long generation

export async function POST(req: Request) {
  const { project_id } = await req.json();

  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (!project?.outline || !project?.analysis) {
    return NextResponse.json(
      { error: 'Le projet doit avoir une trame validée' },
      { status: 400 }
    );
  }

  await supabase
    .from('projects')
    .update({ status: 'generating' })
    .eq('id', project_id);

  // Clear existing sections
  await supabase
    .from('generated_sections')
    .delete()
    .eq('project_id', project_id);

  // Get knowledge blocks and examples
  const [knowledgeRes, examplesRes] = await Promise.all([
    supabase.from('knowledge_blocks').select('*'),
    supabase.from('memory_examples').select('*'),
  ]);

  const knowledgeBlocks = knowledgeRes.data ?? [];
  const examples = examplesRes.data ?? [];
  const analysisContext = JSON.stringify(project.analysis, null, 2);

  const outline = project.outline as OutlineSection[];

  // Generate each section sequentially
  for (let i = 0; i < outline.length; i++) {
    const section = outline[i];

    // Insert pending section
    const { data: sectionRow } = await supabase
      .from('generated_sections')
      .insert({
        project_id,
        title: section.title,
        section_order: i + 1,
        status: 'generating',
      })
      .select()
      .single();

    try {
      // Find relevant knowledge blocks by matching keywords
      const relevantKnowledge = findRelevantContent(
        knowledgeBlocks,
        section,
        'category'
      );
      const relevantExamples = findRelevantContent(
        examples,
        section,
        'section_type'
      );

      const knowledgeText = relevantKnowledge
        .map((k) => `[${k.category} — ${k.title}]\n${k.content}`)
        .join('\n\n---\n\n');

      const examplesText = relevantExamples
        .map((e) => `[${e.section_type} — ${e.title}]\n${e.content}`)
        .join('\n\n---\n\n');

      const sectionType: SectionType = section.type || 'autre';
      const sectionWeight: number | null = section.weight ?? null;

      const content = await callClaude(
        GENERATION_SYSTEM,
        generateSectionPrompt(
          i + 1,
          section.title,
          sectionType,
          section.description,
          section.key_points,
          section.importance,
          sectionWeight,
          section.criterion_ref ?? null,
          analysisContext,
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

      await supabase
        .from('generated_sections')
        .update({
          content,
          sources,
          status: 'generated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', sectionRow!.id);
    } catch {
      await supabase
        .from('generated_sections')
        .update({ status: 'pending' })
        .eq('id', sectionRow!.id);
    }
  }

  await supabase
    .from('projects')
    .update({
      status: 'generated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', project_id);

  return NextResponse.json({ ok: true });
}

// Simple relevance matching based on category/section_type and keyword overlap
function findRelevantContent<
  T extends { title: string; content: string; [key: string]: unknown },
>(items: T[], section: OutlineSection, typeField: string): T[] {
  const sectionWords = [
    section.title,
    section.description,
    ...section.key_points,
  ]
    .join(' ')
    .toLowerCase();

  // Map outline themes to knowledge categories
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
    // Fallback: keyword overlap
    const itemText = `${item.title} ${item.content}`.toLowerCase();
    return sectionWords.split(' ').filter((w) => w.length > 4 && itemText.includes(w)).length >= 2;
  });
}
