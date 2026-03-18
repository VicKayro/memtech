import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseDocument } from '@/lib/parsers';

export async function POST(req: Request) {
  const formData = await req.formData();
  const projectId = formData.get('project_id') as string;
  const files = formData.getAll('files') as File[];

  if (!projectId || files.length === 0) {
    return NextResponse.json(
      { error: 'project_id et au moins un fichier sont requis' },
      { status: 400 }
    );
  }

  const results = [];

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = await parseDocument(buffer, file.name);

      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          name: file.name,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      results.push({ name: file.name, status: 'ok', id: data.id });
    } catch (err) {
      results.push({
        name: file.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    }
  }

  return NextResponse.json({ results });
}
