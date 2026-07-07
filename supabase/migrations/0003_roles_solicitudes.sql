-- ──────────────────────────────────────────────────────────────────────────
-- 0003 · Roles (admin / operador / solicitante) + Solicitudes
--
-- Añade el concepto de ROL, que vive en el JWT (app_metadata.role), igual que
-- `tenant_id`. No es editable por el cliente; lo setea el backend (service role).
--
--   admin       → super usuario. CRUD de operadores. Ve todo.
--   operador    → equipo interno. Gestiona TODAS las solicitudes (status, link).
--   solicitante → agencia. Crea y ve SOLO sus solicitudes.
--
-- Regla de negocio: 1 usuario por agencia (relacion 1:1, unica).
-- ──────────────────────────────────────────────────────────────────────────

-- ── Helpers de rol (JWT) ────────────────────────────────────────────────────
-- STABLE + search_path fijo para evitar inyeccion via search_path (igual que
-- current_tenant_id en 0001).

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
    ''
  )
$$;

-- Staff = admin u operador. Cruzan tenants (ven todas las agencias).
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() in ('admin', 'operador'), false)
$$;

-- ── Agencia: 1 usuario unico + direccion (catalogo Go On) ───────────────────
-- `user_id` es nullable hasta que la agencia se registra. UNIQUE garantiza a
-- nivel de BD que una agencia no tiene dos cuentas y un usuario no queda en dos
-- agencias. `on delete set null`: si se borra el usuario, la agencia queda
-- "disponible" para reclamarse de nuevo (no se pierde la fila ni su historial).
alter table public.agencies
  add column if not exists user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists address text;

-- ── Enums de solicitud ──────────────────────────────────────────────────────
do $$ begin
  create type public.pauta_o_feed as enum ('pauta', 'feed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.solicitud_status as enum (
    'nueva',
    'en_proceso',
    'en_revision',
    'requiere_info',
    'lista',
    'publicada',
    'cancelada'
  );
exception when duplicate_object then null; end $$;

-- ── Tabla de solicitudes (1 fila = 1 fila del Excel maestro) ────────────────
create table if not exists public.solicitudes (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.agencies(id) on delete cascade,
  tipo_contenido           text not null,
  descripcion              text not null default '',
  informacion              text not null default '',
  insumos                  text not null default '',            -- links (Drive/WhatsApp); archivos a Storage en v2
  pauta_o_feed             public.pauta_o_feed,
  segmentacion_geografica  text not null default '',
  status                   public.solicitud_status not null default 'nueva',
  link_final               text not null default '',
  created_by               uuid not null default auth.uid(),
  created_at               timestamptz not null default now(),
  updated_by               uuid,
  updated_at               timestamptz not null default now()
);
create index if not exists solicitudes_tenant_idx on public.solicitudes (tenant_id, created_at desc);
create index if not exists solicitudes_status_idx on public.solicitudes (status, created_at desc);

-- ── RLS: solicitante ve lo suyo; staff (admin/operador) ve todo ─────────────
alter table public.solicitudes enable row level security;

-- SELECT: staff todo; solicitante solo su agencia.
drop policy if exists solicitudes_select on public.solicitudes;
create policy solicitudes_select on public.solicitudes
  for select
  using (public.is_staff() or tenant_id = public.current_tenant_id());

-- INSERT: staff cualquier agencia; solicitante solo la suya.
drop policy if exists solicitudes_insert on public.solicitudes;
create policy solicitudes_insert on public.solicitudes
  for insert
  with check (public.is_staff() or tenant_id = public.current_tenant_id());

-- UPDATE: el gate de FILA lo da is_staff/tenant; el gate de CAMPO (que el
-- solicitante no toque status/link_final y solo mientras 'nueva') lo aplica el
-- trigger de permisos en 0004.
drop policy if exists solicitudes_update on public.solicitudes;
create policy solicitudes_update on public.solicitudes
  for update
  using (public.is_staff() or tenant_id = public.current_tenant_id())
  with check (public.is_staff() or tenant_id = public.current_tenant_id());

-- DELETE: staff cualquiera; solicitante solo las suyas y solo mientras 'nueva'.
drop policy if exists solicitudes_delete on public.solicitudes;
create policy solicitudes_delete on public.solicitudes
  for delete
  using (
    public.is_staff()
    or (tenant_id = public.current_tenant_id() and status = 'nueva')
  );

-- ── Agencias: staff ve/gestiona todas (para el tablero del operador) ────────
-- Se reescribe la politica de 0001 añadiendo la vision de staff. El solicitante
-- sigue viendo solo la suya.
drop policy if exists agencies_isolation on public.agencies;
create policy agencies_isolation on public.agencies
  for all
  using (id = public.current_tenant_id() or public.is_staff())
  with check (id = public.current_tenant_id() or public.is_staff());

-- ── Grants (patron de 0002; explicitos para portabilidad) ───────────────────
grant select, insert, update, delete on public.solicitudes to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_staff() to authenticated;
