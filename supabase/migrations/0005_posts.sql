-- ──────────────────────────────────────────────────────────────────────────
-- 0005 · Posts (Estudio) · persistencia + trazabilidad
--
-- Guarda los diseños del editor (desde cero o desde una solicitud) para poder
-- volver a verlos/editarlos. Solo staff (operador/admin) los gestiona.
-- `design` es el JSON del editor (capas, fondo, formato). `tenant_id` y
-- `solicitud_id` son OPCIONALES (los posts "desde cero" no los tienen).
-- ──────────────────────────────────────────────────────────────────────────

do $$ begin
  create type public.post_status as enum ('borrador', 'listo', 'publicado');
exception when duplicate_object then null; end $$;

create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null default 'Post sin título',
  tenant_id    uuid references public.agencies(id) on delete set null,
  solicitud_id uuid references public.solicitudes(id) on delete set null,
  design       jsonb not null,
  caption      text not null default '',
  status       public.post_status not null default 'borrador',
  created_by   uuid not null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_by   uuid,
  updated_at   timestamptz not null default now()
);
create index if not exists posts_updated_idx on public.posts (updated_at desc);
create index if not exists posts_solicitud_idx on public.posts (solicitud_id);

-- ── RLS: solo staff gestiona posts (herramienta interna de creativos) ───────
alter table public.posts enable row level security;

drop policy if exists posts_staff_all on public.posts;
create policy posts_staff_all on public.posts
  for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── Sella quién y cuándo modificó (trazabilidad) ────────────────────────────
create or replace function public.posts_touch()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch
  before update on public.posts
  for each row execute function public.posts_touch();

grant select, insert, update, delete on public.posts to authenticated;
