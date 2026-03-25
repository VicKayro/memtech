import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');

  if (!projectId) {
    return NextResponse.json({ error: 'project_id requis' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('project_estimates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { project_id, line_items } = body;

  if (!project_id) {
    return NextResponse.json({ error: 'project_id requis' }, { status: 400 });
  }

  // Calculate total
  const total_ht = (line_items || []).reduce(
    (sum: number, item: { total: number }) => sum + (item.total || 0),
    0,
  );

  // Upsert: check if estimate exists for this project
  const { data: existing } = await supabase
    .from('project_estimates')
    .select('id')
    .eq('project_id', project_id)
    .limit(1)
    .single();

  let data, error;

  if (existing) {
    ({ data, error } = await supabase
      .from('project_estimates')
      .update({ line_items, total_ht, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('project_estimates')
      .insert({ project_id, line_items, total_ht })
      .select()
      .single());
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
