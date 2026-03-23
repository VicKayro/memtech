import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { OutlineSection } from '@/types';

// This route now ONLY creates pending sections and returns immediately.
// Actual generation happens client-side via /api/generate-section calls.

export async function POST(req: Request) {
  const { project_id } = await req.json();

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

  // Set project to generating
  await supabase
    .from('projects')
    .update({ status: 'generating' })
    .eq('id', project_id);

  // Clear existing sections
  await supabase
    .from('generated_sections')
    .delete()
    .eq('project_id', project_id);

  const outline = project.outline as OutlineSection[];

  // Create all sections as 'pending'
  const rows = outline.map((section, i) => ({
    project_id,
    title: section.title,
    section_order: i + 1,
    status: 'pending',
  }));

  const { data: sections, error } = await supabase
    .from('generated_sections')
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sections });
}
