import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaudeJSON } from '@/lib/anthropic';
import { DPGF_EXTRACTION_SYSTEM, dpgfExtractionPrompt } from '@/lib/prompts';

export const maxDuration = 120;

interface ExtractedLine {
  category: string;
  subcategory: string | null;
  designation: string;
  unit: string;
  unit_price: number | null;
  qty: number | null;
  notes: string | null;
}

interface ExtractionResult {
  lines: ExtractedLine[];
  project_name: string;
  total_lines: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content, fileName, projectName } = body;

    if (!content) {
      return NextResponse.json({ error: 'Contenu du document requis' }, { status: 400 });
    }

    // Truncate to 100k chars for safety
    const truncated = content.slice(0, 100000);

    const result = await callClaudeJSON<ExtractionResult>(
      DPGF_EXTRACTION_SYSTEM,
      dpgfExtractionPrompt(truncated, projectName || fileName),
      8192,
    );

    if (!result.lines || result.lines.length === 0) {
      return NextResponse.json({ error: 'Aucune ligne de prix trouvée dans le document' }, { status: 400 });
    }

    // Insert all extracted lines into price_items
    const rows = result.lines.map((line) => ({
      category: line.category || 'autre',
      subcategory: line.subcategory || null,
      designation: line.designation,
      unit: line.unit || 'u',
      unit_price: line.unit_price ?? null,
      source_project: projectName || fileName || null,
      source_year: new Date().getFullYear().toString(),
      notes: line.notes || (line.qty ? `Qté originale: ${line.qty}` : null),
    }));

    const { data, error } = await supabase
      .from('price_items')
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      imported: data?.length ?? 0,
      total_extracted: result.lines.length,
      items: data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur import DPGF';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
