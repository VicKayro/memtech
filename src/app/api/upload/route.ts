import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const maxDuration = 30;

// Accept JSON body: { project_id, documents: [{ name, content }] }
// Content is pre-parsed text from client-side parsing
export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return handleJSONUpload(req);
  }

  // Legacy: FormData upload (for small files only)
  return handleFormDataUpload(req);
}

async function handleJSONUpload(req: Request) {
  const { project_id, documents } = await req.json();

  if (!project_id || !documents || !Array.isArray(documents)) {
    return NextResponse.json(
      { error: 'project_id et documents[] sont requis' },
      { status: 400 }
    );
  }

  const results = [];

  for (const doc of documents) {
    if (!doc.name || !doc.content) {
      results.push({ name: doc.name ?? 'inconnu', status: 'error', error: 'Nom et contenu requis' });
      continue;
    }

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id,
          name: doc.name,
          content: doc.content,
        })
        .select()
        .single();

      if (error) throw error;
      results.push({ name: doc.name, status: 'ok', id: data.id });
    } catch (err) {
      results.push({
        name: doc.name,
        status: 'error',
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      });
    }
  }

  return NextResponse.json({ results });
}

async function handleFormDataUpload(req: Request) {
  // Keep legacy FormData support for backwards compatibility
  const { parseDocument } = await import('@/lib/parsers');

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
