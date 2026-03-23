-- Company profiles for MemTech
-- Run this in Supabase SQL Editor

create table if not exists company_profiles (
  id uuid primary key default gen_random_uuid(),
  is_default boolean default true,
  company_info jsonb default '{}'::jsonb,
  personnel jsonb default '[]'::jsonb,
  equipment jsonb default '[]'::jsonb,
  suppliers jsonb default '[]'::jsonb,
  project_references jsonb default '[]'::jsonb,
  certifications jsonb default '[]'::jsonb,
  safety_indicators jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure only one default profile
create unique index if not exists idx_company_default on company_profiles(is_default) where is_default = true;

-- RLS (MVP: allow all)
alter table company_profiles enable row level security;
create policy "Allow all on company_profiles" on company_profiles for all using (true) with check (true);
