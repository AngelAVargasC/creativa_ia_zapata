-- ──────────────────────────────────────────────────────────────────────────
-- 0001 · Esquema base multi-tenant con RLS
-- Aislamiento por agencia (tenant). `tenant_id` en todo. RLS obligatorio.
-- El tenant del usuario vive en el JWT (app_metadata.tenant_id), no en el cliente.
-- ──────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- Helper: tenant del usuario actual a partir de los claims del JWT.
-- STABLE + search_path fijo para evitar inyeccion via search_path.
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id'),
    ''
  )::uuid
$$;

-- ── Agencias (raiz del tenant) ──────────────────────────────────────────────
create table if not exists public.agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- ── Perfil de marca por agencia ─────────────────────────────────────────────
create table if not exists public.brand_profiles (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.agencies(id) on delete cascade,
  voice         text not null,
  banned_words  text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tenant_id)
);

-- ── Piezas de contenido generadas ───────────────────────────────────────────
create table if not exists public.content_pieces (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.agencies(id) on delete cascade,
  kind        text not null check (kind in ('copy', 'script', 'proposal', 'dynamic')),
  platform    text check (platform in ('facebook', 'instagram')),
  status      text not null default 'draft' check (status in ('draft', 'approved', 'published')),
  payload     jsonb not null,
  created_by  uuid not null,
  created_at  timestamptz not null default now()
);
create index if not exists content_pieces_tenant_idx on public.content_pieces (tenant_id, created_at desc);

-- ── Telemetria de generacion (tokens / costo / latencia) ────────────────────
create table if not exists public.generation_logs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.agencies(id) on delete cascade,
  task           text not null,
  provider       text not null,
  model          text not null,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  latency_ms     integer not null default 0,
  cost_usd       numeric(12, 6) not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists generation_logs_tenant_idx on public.generation_logs (tenant_id, created_at desc);

-- ── RLS: activar y aislar por tenant ────────────────────────────────────────
alter table public.agencies        enable row level security;
alter table public.brand_profiles  enable row level security;
alter table public.content_pieces  enable row level security;
alter table public.generation_logs enable row level security;

-- Agencia: el usuario solo ve la suya.
drop policy if exists agencies_isolation on public.agencies;
create policy agencies_isolation on public.agencies
  for all
  using (id = public.current_tenant_id())
  with check (id = public.current_tenant_id());

-- Tablas hijas: aislamiento por tenant_id en lectura y escritura.
drop policy if exists brand_profiles_isolation on public.brand_profiles;
create policy brand_profiles_isolation on public.brand_profiles
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists content_pieces_isolation on public.content_pieces;
create policy content_pieces_isolation on public.content_pieces
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

drop policy if exists generation_logs_isolation on public.generation_logs;
create policy generation_logs_isolation on public.generation_logs
  for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());
