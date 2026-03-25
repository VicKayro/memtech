import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaudeJSON } from '@/lib/anthropic';
import {
  QUOTE_PARSING_SYSTEM,
  quoteParsingPrompt,
  QUOTE_ALIGNMENT_SYSTEM,
  quoteAlignmentPrompt,
} from '@/lib/prompts';

export const maxDuration = 120;

interface ParsedLine {
  designation: string;
  unit: string;
  qty: number;
  unit_price: number;
  total: number;
}

interface ParsedQuote {
  supplier: string;
  lines: ParsedLine[];
  total_ht: number;
}

interface AlignmentResult {
  aligned_lines: Array<{
    designation: string;
    unit: string;
    qty: number | null;
    prices: Record<string, number | null>;
  }>;
  totals: Record<string, number>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, quotes } = body;
    // quotes: [{supplier_name, content}]

    if (!id) {
      return NextResponse.json({ error: 'id du comparatif requis' }, { status: 400 });
    }
    if (!quotes || quotes.length < 2) {
      return NextResponse.json({ error: 'Au moins 2 devis requis' }, { status: 400 });
    }

    // Update status to analyzing
    await supabase
      .from('quote_comparisons')
      .update({ status: 'analyzing' })
      .eq('id', id);

    // Step 1: Parse each quote individually
    const parsedQuotes: ParsedQuote[] = [];

    for (const quote of quotes) {
      const truncated = quote.content.slice(0, 80000);
      const parsed = await callClaudeJSON<ParsedQuote>(
        QUOTE_PARSING_SYSTEM,
        quoteParsingPrompt(truncated, quote.supplier_name),
        8192,
      );
      parsedQuotes.push(parsed);
    }

    // Step 2: Align all quotes
    const alignment = await callClaudeJSON<AlignmentResult>(
      QUOTE_ALIGNMENT_SYSTEM,
      quoteAlignmentPrompt(parsedQuotes),
      8192,
    );

    // Step 3: Save results
    const suppliers = quotes.map((q: { supplier_name: string; file_name: string }) => ({
      name: q.supplier_name,
      file_name: q.file_name || q.supplier_name,
    }));

    const { data, error } = await supabase
      .from('quote_comparisons')
      .update({
        suppliers,
        line_items: alignment.aligned_lines,
        status: 'done',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      await supabase.from('quote_comparisons').update({ status: 'pending' }).eq('id', id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur analyse devis';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
