-- MemTech - Schema for BTP tender technical memorandum generator
-- Run this in Supabase SQL Editor to set up the database

-- Projects (appels d'offres)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'uploaded',
  market_type text,
  analysis jsonb,
  outline jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents (pièces du dossier)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  doc_type text,
  content text,
  created_at timestamptz default now()
);

-- Knowledge blocks (base de connaissances interne)
create table if not exists knowledge_blocks (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Memory examples (sections de bons mémoires techniques)
create table if not exists memory_examples (
  id uuid primary key default gen_random_uuid(),
  section_type text not null,
  title text not null,
  content text not null,
  source text,
  created_at timestamptz default now()
);

-- Generated sections (sections générées pour un projet)
create table if not exists generated_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  content text,
  sources jsonb,
  section_order integer not null,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_documents_project on documents(project_id);
create index if not exists idx_sections_project on generated_sections(project_id);
create index if not exists idx_knowledge_category on knowledge_blocks(category);
create index if not exists idx_examples_type on memory_examples(section_type);

-- RLS policies (adjust as needed)
alter table projects enable row level security;
alter table documents enable row level security;
alter table knowledge_blocks enable row level security;
alter table memory_examples enable row level security;
alter table generated_sections enable row level security;

-- For MVP: allow all operations (tighten for production)
create policy "Allow all on projects" on projects for all using (true) with check (true);
create policy "Allow all on documents" on documents for all using (true) with check (true);
create policy "Allow all on knowledge_blocks" on knowledge_blocks for all using (true) with check (true);
create policy "Allow all on memory_examples" on memory_examples for all using (true) with check (true);
create policy "Allow all on generated_sections" on generated_sections for all using (true) with check (true);
