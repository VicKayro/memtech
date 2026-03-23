import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const EMPTY_COMPANY_INFO = {
  name: '', legal_form: '', siret: '', address: '', creation_date: '',
  headcount: null, revenue_n1: '', revenue_n2: '', revenue_n3: '',
  activity_description: '', insurance_rc: '', insurance_decennale: '',
};

const EMPTY_SAFETY = {
  tf: '', tg: '', nb_accidents_n1: '', nb_accidents_n2: '',
  sst_count: '', safety_budget: '',
};

// GET — fetch the default profile (or null)
export async function GET() {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST — create a new default profile
export async function POST(req: Request) {
  const body = await req.json();

  const { data, error } = await supabase
    .from('company_profiles')
    .insert({
      is_default: true,
      company_info: body.company_info ?? EMPTY_COMPANY_INFO,
      personnel: body.personnel ?? [],
      equipment: body.equipment ?? [],
      suppliers: body.suppliers ?? [],
      project_references: body.project_references ?? [],
      certifications: body.certifications ?? [],
      safety_indicators: body.safety_indicators ?? EMPTY_SAFETY,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT — update the default profile
export async function PUT(req: Request) {
  const body = await req.json();

  // Upsert: find the default profile first
  const { data: existing } = await supabase
    .from('company_profiles')
    .select('id')
    .eq('is_default', true)
    .maybeSingle();

  if (!existing) {
    // Create it if it doesn't exist
    const { data, error } = await supabase
      .from('company_profiles')
      .insert({
        is_default: true,
        company_info: body.company_info ?? EMPTY_COMPANY_INFO,
        personnel: body.personnel ?? [],
        equipment: body.equipment ?? [],
        suppliers: body.suppliers ?? [],
        project_references: body.project_references ?? [],
        certifications: body.certifications ?? [],
        safety_indicators: body.safety_indicators ?? EMPTY_SAFETY,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.company_info !== undefined) updateFields.company_info = body.company_info;
  if (body.personnel !== undefined) updateFields.personnel = body.personnel;
  if (body.equipment !== undefined) updateFields.equipment = body.equipment;
  if (body.suppliers !== undefined) updateFields.suppliers = body.suppliers;
  if (body.project_references !== undefined) updateFields.project_references = body.project_references;
  if (body.certifications !== undefined) updateFields.certifications = body.certifications;
  if (body.safety_indicators !== undefined) updateFields.safety_indicators = body.safety_indicators;

  const { data, error } = await supabase
    .from('company_profiles')
    .update(updateFields)
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE — remove the default profile
export async function DELETE() {
  const { error } = await supabase
    .from('company_profiles')
    .delete()
    .eq('is_default', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
