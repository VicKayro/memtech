import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaudeJSON } from '@/lib/anthropic';
import { OUTLINE_SYSTEM, outlinePrompt } from '@/lib/prompts';
import type { OutlineSection } from '@/types';

export async function POST(req: Request) {
  const { project_id } = await req.json();

  // Get project with analysis
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (projErr || !project?.analysis) {
    return NextResponse.json(
      { error: 'Le projet doit être analysé avant de proposer une trame' },
      { status: 400 }
    );
  }

  try {
    const result = await callClaudeJSON<{ sections: OutlineSection[] }>(
      OUTLINE_SYSTEM,
      outlinePrompt(JSON.stringify(project.analysis, null, 2)),
      4096
    );

    // Save outline
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'outlined',
        outline: result.sections,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la génération de la trame' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const { project_id, outline } = await req.json();

  const { data, error } = await supabase
    .from('projects')
    .update({
      outline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', project_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
