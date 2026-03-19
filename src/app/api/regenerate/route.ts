import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaude } from '@/lib/anthropic';
import { GENERATION_SYSTEM, generateSectionPrompt } from '@/lib/prompts';
import type { SectionType } from '@/types';

export async function POST(req: Request) {
  const { section_id } = await req.json();

  // Get section
  const { data: section } = await supabase
    .from('generated_sections')
    .select('*')
    .eq('id', section_id)
    .single();

  if (!section) {
    return NextResponse.json({ error: 'Section non trouvée' }, { status: 404 });
  }

  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', section.project_id)
    .single();

  if (!project?.analysis || !project?.outline) {
    return NextResponse.json({ error: 'Projet incomplet' }, { status: 400 });
  }

  // Find outline section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outlineSection = (project.outline as any[]).find(
    (s: { title: string }) => s.title === section.title
  );

  if (!outlineSection) {
    return NextResponse.json({ error: 'Section non trouvée dans la trame' }, { status: 400 });
  }

  await supabase
    .from('generated_sections')
    .update({ status: 'generating' })
    .eq('id', section_id);

  try {
    // Get knowledge and examples
    const [knowledgeRes, examplesRes] = await Promise.all([
      supabase.from('knowledge_blocks').select('*'),
      supabase.from('memory_examples').select('*'),
    ]);

    const sectionType: SectionType = outlineSection.type || 'autre';
    const sectionWeight: number | null = outlineSection.weight ?? null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionIndex = (project.outline as any[]).indexOf(outlineSection);

    const content = await callClaude(
      GENERATION_SYSTEM,
      generateSectionPrompt(
        sectionIndex + 1,
        outlineSection.title,
        sectionType,
        outlineSection.description,
        outlineSection.key_points,
        outlineSection.importance || 'moyenne',
        sectionWeight,
        outlineSection.criterion_ref ?? null,
        JSON.stringify(project.analysis, null, 2),
        (knowledgeRes.data ?? [])
          .map((k) => `[${k.category} — ${k.title}]\n${k.content}`)
          .join('\n\n---\n\n'),
        (examplesRes.data ?? [])
          .map((e) => `[${e.section_type} — ${e.title}]\n${e.content}`)
          .join('\n\n---\n\n')
      ),
      { maxTokens: 8192 }
    );

    const { data, error } = await supabase
      .from('generated_sections')
      .update({
        content,
        status: 'generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', section_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    await supabase
      .from('generated_sections')
      .update({ status: 'generated' })
      .eq('id', section_id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la regénération' },
      { status: 500 }
    );
  }
}
