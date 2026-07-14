-- ──────────────────────────────────────────────────────────────────────────
-- 0006 · Catálogo real de solicitudes
--   • status: enum -> text (el flujo evoluciona; se valida en la app con Zod).
--   • formato: reemplaza el binario pauta_o_feed por texto libre con catálogo
--     (Feed, Pauta, Story, Reel, Carrusel, Material para impresión, …).
--   • nuevas columnas: copy_out, comentarios, pautado (¿PAUTADO? TRUE/FALSE).
-- ──────────────────────────────────────────────────────────────────────────

-- 1) status enum -> text
alter table public.solicitudes alter column status drop default;
alter table public.solicitudes alter column status type text using status::text;
alter table public.solicitudes alter column status set default 'nueva';

-- 2) formato (texto) en lugar de pauta_o_feed (enum)
alter table public.solicitudes add column if not exists formato text not null default '';
update public.solicitudes set formato = coalesce(pauta_o_feed::text, '') where formato = '' and pauta_o_feed is not null;
alter table public.solicitudes drop column if exists pauta_o_feed;

-- 3) columnas nuevas
alter table public.solicitudes add column if not exists comentarios text not null default '';
alter table public.solicitudes add column if not exists copy_out    text not null default '';
alter table public.solicitudes add column if not exists pautado     boolean not null default false;

-- 4) tipo enum ya sin uso
drop type if exists public.pauta_o_feed;

-- 5) Auditoría: registrar los campos nuevos y quitar pauta_o_feed
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
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'insert', null, null, null);
    return new;
  end if;

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
  if new.formato is distinct from old.formato then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'formato', old.formato, new.formato);
  end if;
  if new.segmentacion_geografica is distinct from old.segmentacion_geografica then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'segmentacion_geografica', old.segmentacion_geografica, new.segmentacion_geografica);
  end if;
  if new.status is distinct from old.status then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'status', old.status, new.status);
  end if;
  if new.link_final is distinct from old.link_final then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'link_final', old.link_final, new.link_final);
  end if;
  if new.comentarios is distinct from old.comentarios then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'comentarios', old.comentarios, new.comentarios);
  end if;
  if new.copy_out is distinct from old.copy_out then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'copy_out', old.copy_out, new.copy_out);
  end if;
  if new.pautado is distinct from old.pautado then
    insert into public.solicitud_eventos (solicitud_id, tenant_id, changed_by, changed_role, action, field, old_value, new_value)
    values (new.id, new.tenant_id, v_by, v_role, 'update', 'pautado', old.pautado::text, new.pautado::text);
  end if;

  return new;
end;
$$;
