-- ──────────────────────────────────────────────────────────────────────────
-- 0004 · Trazabilidad de solicitudes (anti "telefono descompuesto")
--
-- Dos garantias, ambas a nivel de BASE DE DATOS (no confiables solo en la UI):
--
--   1. Permisos por CAMPO segun rol  → trigger BEFORE UPDATE.
--      El solicitante no puede tocar `status` ni `link_final`, y solo edita
--      mientras la solicitud esta 'nueva'. Staff (admin/operador) puede todo.
--
--   2. Auditoria inmutable            → trigger AFTER INSERT/UPDATE.
--      Cada cambio deja una fila (quien, rol, campo, antes, despues, cuando)
--      con el `auth.uid()` REAL del JWT. No se puede escribir a mano ni editar:
--      no hay policy de INSERT/UPDATE/DELETE para `authenticated`; solo el
--      trigger (security definer) escribe. Asi nadie puede justificar un cambio
--      que no pidieron con una edicion silenciosa.
-- ──────────────────────────────────────────────────────────────────────────

-- ── Bitacora inmutable ──────────────────────────────────────────────────────
create table if not exists public.solicitud_eventos (
  id            uuid primary key default gen_random_uuid(),
  solicitud_id  uuid not null references public.solicitudes(id) on delete cascade,
  tenant_id     uuid not null,
  changed_by    uuid,                 -- auth.uid() del actor
  changed_role  text,                 -- admin | operador | solicitante
  action        text not null,        -- 'insert' | 'update'
  field         text,                 -- campo modificado (null en 'insert')
  old_value     text,
  new_value     text,
  created_at    timestamptz not null default now()
);
create index if not exists solicitud_eventos_idx
  on public.solicitud_eventos (solicitud_id, created_at desc);

-- RLS: lectura para el dueño (su tenant) y para staff. NADIE escribe directo:
-- sin policy de insert/update/delete para authenticated => solo el trigger
-- (security definer) puede insertar. Bitacora inmutable desde la app.
alter table public.solicitud_eventos enable row level security;

drop policy if exists solicitud_eventos_select on public.solicitud_eventos;
create policy solicitud_eventos_select on public.solicitud_eventos
  for select
  using (public.is_staff() or tenant_id = public.current_tenant_id());

-- ── Trigger 1 · Permisos por campo (BEFORE UPDATE) ──────────────────────────
create or replace function public.solicitudes_enforce_perms()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_app_role();
begin
  -- Sellamos siempre quien y cuando modifico.
  new.updated_by := auth.uid();
  new.updated_at := now();

  -- Staff (admin/operador): sin restriccion de campo.
  if v_role in ('admin', 'operador') then
    return new;
  end if;

  -- Solicitante (o cualquier no-staff): reglas estrictas.
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'No puedes cambiar la agencia de la solicitud';
  end if;
  if old.status <> 'nueva' then
    raise exception 'La solicitud ya esta en proceso; ya no puedes editarla';
  end if;
  if new.status is distinct from old.status then
    raise exception 'No puedes cambiar el estatus de la solicitud';
  end if;
  if new.link_final is distinct from old.link_final then
    raise exception 'No puedes cambiar el link final';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_solicitudes_perms on public.solicitudes;
create trigger trg_solicitudes_perms
  before update on public.solicitudes
  for each row execute function public.solicitudes_enforce_perms();

-- ── Trigger 2 · Auditoria (AFTER INSERT/UPDATE) ─────────────────────────────
-- Una fila por campo modificado. Los enums se castean a text para guardarlos.
create or replace function public.solicitudes_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_by   uuid := auth.uid();
  v_role text := public.current_app_role();
begin
  if tg_op = 'INSERT' then
    insert into public.solicitud_eventos
      (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values
      (new.id, new.tenant_id, v_by, v_role, 'insert', null, null, null);
    return new;
  end if;

  -- UPDATE: registrar campo por campo lo que cambio.
  if new.tipo_contenido is distinct from old.tipo_contenido then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'tipo_contenido', old.tipo_contenido, new.tipo_contenido);
  end if;
  if new.descripcion is distinct from old.descripcion then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'descripcion', old.descripcion, new.descripcion);
  end if;
  if new.informacion is distinct from old.informacion then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'informacion', old.informacion, new.informacion);
  end if;
  if new.insumos is distinct from old.insumos then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'insumos', old.insumos, new.insumos);
  end if;
  if new.pauta_o_feed is distinct from old.pauta_o_feed then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'pauta_o_feed', old.pauta_o_feed::text, new.pauta_o_feed::text);
  end if;
  if new.segmentacion_geografica is distinct from old.segmentacion_geografica then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'segmentacion_geografica', old.segmentacion_geografica, new.segmentacion_geografica);
  end if;
  if new.status is distinct from old.status then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'status', old.status::text, new.status::text);
  end if;
  if new.link_final is distinct from old.link_final then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'link_final', old.link_final, new.link_final);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_solicitudes_audit on public.solicitudes;
create trigger trg_solicitudes_audit
  after insert or update on public.solicitudes
  for each row execute function public.solicitudes_audit();

-- ── Grants ──────────────────────────────────────────────────────────────────
-- authenticated solo necesita SELECT sobre la bitacora (el resto lo bloquea RLS).
grant select on public.solicitud_eventos to authenticated;
