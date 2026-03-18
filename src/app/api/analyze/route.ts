import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaudeJSON } from '@/lib/anthropic';
import { ANALYSIS_SYSTEM, analysisPrompt } from '@/lib/prompts';
import type { Analysis } from '@/types';

export async function POST(req: Request) {
  const { project_id } = await req.json();

  // Update status
  await supabase
    .from('projects')
    .update({ status: 'analyzing' })
    .eq('id', project_id);

  // Get documents
  const { data: docs, error: docsErr } = await supabase
    .from('documents')
    .select('name, content')
    .eq('project_id', project_id);

  if (docsErr || !docs?.length) {
    return NextResponse.json(
      { error: 'Aucun document trouvé pour ce projet' },
      { status: 400 }
    );
  }

  // Build documents text with clear separation
  const documentsText = docs
    .map((d) => `--- DOCUMENT : ${d.name} ---\n${d.content}`)
    .join('\n\n');

  // Truncate if too long (keep under ~150k chars for safety)
  const truncated =
    documentsText.length > 150000
      ? documentsText.slice(0, 150000) + '\n\n[... document tronqué pour longueur]'
      : documentsText;

  try {
    const analysis = await callClaudeJSON<Analysis>(
      ANALYSIS_SYSTEM,
      analysisPrompt(truncated),
      8192
    );

    // Save analysis
    const { data, error } = await supabase
      .from('projects')
      .update({
        status: 'analyzed',
        market_type: analysis.market_type,
        analysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project_id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    await supabase
      .from('projects')
      .update({ status: 'uploaded' })
      .eq('id', project_id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
