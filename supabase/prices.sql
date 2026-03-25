-- MemTech - Chiffrage & Bible de prix
-- Run this in Supabase SQL Editor

-- ═══════════════════════════════════════════════
-- Phase 1 : Bible de prix
-- ═══════════════════════════════════════════════

create table if not exists price_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,        -- 'gros_oeuvre', 'second_oeuvre', 'vrd', etc.
  subcategory text,              -- 'fondations', 'voiles', 'planchers'
  designation text not null,     -- 'Béton C25/30 XC1 en voiles'
  unit text not null,            -- 'm³', 'm²', 'ml', 'u', 'kg', 'forfait'
  unit_price decimal,            -- prix unitaire HT
  source_project text,           -- 'EHPAD Wasquehal 2025'
  source_year text,              -- '2025'
  notes text,
  carbon_kg_per_unit decimal,    -- Phase 4: kg CO₂e par unité
  created_at timestamptz default now()
);

create index if not exists idx_price_items_category on price_items(category);
create index if not exists idx_price_items_designation on price_items using gin (to_tsvector('french', designation));

-- ═══════════════════════════════════════════════
-- Phase 2 : Comparaison de devis
-- ═══════════════════════════════════════════════

create table if not exists quote_comparisons (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  name text not null,             -- 'Comparatif lot Gros Oeuvre'
  suppliers jsonb default '[]',   -- [{name, file_name}]
  line_items jsonb default '[]',  -- [{designation, unit, qty, prices: {supplier1: x, supplier2: y}}]
  status text default 'pending',  -- pending, analyzing, done
  created_at timestamptz default now()
);

create index if not exists idx_quote_comparisons_project on quote_comparisons(project_id);

-- ═══════════════════════════════════════════════
-- Phase 3 : Chiffrage rapide (estimations projet)
-- ═══════════════════════════════════════════════

create table if not exists project_estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  line_items jsonb default '[]',  -- [{price_item_id, designation, unit, qty, unit_price, total}]
  total_ht decimal,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_estimates_project on project_estimates(project_id);

-- ═══════════════════════════════════════════════
-- RLS policies (MVP: allow all)
-- ═══════════════════════════════════════════════

alter table price_items enable row level security;
alter table quote_comparisons enable row level security;
alter table project_estimates enable row level security;

create policy "Allow all on price_items" on price_items for all using (true) with check (true);
create policy "Allow all on quote_comparisons" on quote_comparisons for all using (true) with check (true);
create policy "Allow all on project_estimates" on project_estimates for all using (true) with check (true);
