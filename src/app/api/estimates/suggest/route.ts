import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaudeJSON } from '@/lib/anthropic';
import { PRICE_SUGGESTION_SYSTEM, priceSuggestionPrompt } from '@/lib/prompts';

export const maxDuration = 60;

interface SuggestedLine {
  price_item_id: string;
  designation: string;
  unit: string;
  qty: number;
  unit_price: number;
  total: number;
  rationale: string;
}

interface SuggestionResult {
  suggested_lines: SuggestedLine[];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id requis' }, { status: 400 });
    }

    // Fetch project with outline
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    if (!project.outline || project.outline.length === 0) {
      return NextResponse.json({ error: 'Le projet n\'a pas encore de trame' }, { status: 400 });
    }

    // Fetch all available prices
    const { data: prices } = await supabase
      .from('price_items')
      .select('id, category, designation, unit, unit_price')
      .not('unit_price', 'is', null);

    if (!prices || prices.length === 0) {
      return NextResponse.json({ error: 'Aucun prix dans la Bible de prix' }, { status: 400 });
    }

    const outlineSections = project.outline.map((s: { title: string; type: string; description: string }) => ({
      title: s.title,
      type: s.type,
      description: s.description,
    }));

    const projectContext = project.analysis
      ? `Marché: ${project.analysis.market_object || project.name}\nType: ${project.analysis.market_type || 'Non défini'}`
      : project.name;

    const result = await callClaudeJSON<SuggestionResult>(
      PRICE_SUGGESTION_SYSTEM,
      priceSuggestionPrompt(outlineSections, prices, projectContext),
      8192,
    );

    return NextResponse.json(result.suggested_lines || []);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur suggestion prix';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
