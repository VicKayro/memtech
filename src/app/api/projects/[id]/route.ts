import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [projectRes, docsRes, sectionsRes] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('documents').select('*').eq('project_id', id).order('created_at'),
    supabase
      .from('generated_sections')
      .select('*')
      .eq('project_id', id)
      .order('section_order'),
  ]);

  if (projectRes.error)
    return NextResponse.json({ error: projectRes.error.message }, { status: 500 });

  return NextResponse.json({
    project: projectRes.data,
    documents: docsRes.data ?? [],
    sections: sectionsRes.data ?? [],
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const { data, error } = await supabase
    .from('projects')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
