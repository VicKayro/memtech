import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callClaudeJSON } from '@/lib/anthropic';
import { SEGMENTATION_SYSTEM, segmentationPrompt } from '@/lib/prompts';
import { KNOWLEDGE_CATEGORIES } from '@/types';

export const maxDuration = 120;

const VALID_CATEGORIES = new Set<string>(KNOWLEDGE_CATEGORIES.map((c) => c.value));
const MAX_CHARS = 80000;

interface SegmentationResult {
  blocks: Array<{ category: string; title: string; content: string }>;
}

// POST — segment one document into knowledge blocks
export async function POST(req: Request) {
  const { name, content } = await req.json();

  if (!name || !content) {
    return NextResponse.json({ error: 'name et content requis' }, { status: 400 });
  }

  try {
    let allBlocks: Array<{ category: string; title: string; content: string }> = [];

    if (content.length <= MAX_CHARS) {
      // Single call
      const result = await callClaudeJSON<SegmentationResult>(
        SEGMENTATION_SYSTEM,
        segmentationPrompt(content, name),
        16384
      );
      allBlocks = result.blocks ?? [];
    } else {
      // Chunk the document at paragraph boundaries
      const chunks = chunkText(content, 60000, 2000);
      for (let i = 0; i < chunks.length; i++) {
        const chunkNote = `[Extrait ${i + 1}/${chunks.length} du document]`;
        const result = await callClaudeJSON<SegmentationResult>(
          SEGMENTATION_SYSTEM,
          segmentationPrompt(`${chunkNote}\n\n${chunks[i]}`, name),
          16384
        );
        allBlocks.push(...(result.blocks ?? []));
      }
    }

    // Validate categories and filter
    const validBlocks = allBlocks
      .filter((b) => b.title && b.content && VALID_CATEGORIES.has(b.category))
      .map((b) => ({
        category: b.category,
        title: b.title.slice(0, 200),
        content: b.content,
      }));

    // Insert into knowledge_blocks
    if (validBlocks.length > 0) {
      const { error } = await supabase.from('knowledge_blocks').insert(validBlocks);
      if (error) throw error;
    }

    return NextResponse.json({
      status: 'ok',
      name,
      blocks_count: validBlocks.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la segmentation' },
      { status: 500 }
    );
  }
}

function chunkText(text: string, targetSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + targetSize, text.length);
    // Find a paragraph boundary near the end
    if (end < text.length) {
      const boundarySearch = text.lastIndexOf('\n\n', end);
      if (boundarySearch > start + targetSize * 0.7) {
        end = boundarySearch;
      }
    }
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }
  return chunks;
}
