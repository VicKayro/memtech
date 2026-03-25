import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let query = supabase
    .from('price_items')
    .select('*')
    .order('category')
    .order('designation');

  if (category) {
    query = query.eq('category', category);
  }
  if (search) {
    query = query.ilike('designation', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from('price_items')
    .insert({
      category: body.category,
      subcategory: body.subcategory || null,
      designation: body.designation,
      unit: body.unit,
      unit_price: body.unit_price ?? null,
      source_project: body.source_project || null,
      source_year: body.source_year || null,
      notes: body.notes || null,
      carbon_kg_per_unit: body.carbon_kg_per_unit ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { data, error } = await supabase
    .from('price_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await supabase
    .from('price_items')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
