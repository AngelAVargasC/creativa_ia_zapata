-- ──────────────────────────────────────────────────────────────────────────
-- 0002 · Privilegios de tabla para los roles del API de Supabase
--
-- RLS (0001) gobierna el acceso por FILA, pero PostgREST tambien exige el
-- privilegio de TABLA (GRANT). En proyectos Supabase nuevos via SQL editor
-- estos GRANT suelen venir por defecto; los dejamos explicitos para que el
-- esquema sea portable (supabase CLI local / CI / proyectos nuevos) y para
-- evitar "permission denied for table ...".
--
-- Importante: service_role IGNORA RLS (lo usa el seed/backend). authenticated
-- queda sujeto a RLS y solo ve/escribe su tenant. anon NO accede a datos.
-- ──────────────────────────────────────────────────────────────────────────

grant usage on schema public to anon, authenticated, service_role;

-- service_role: backend, seed y jobs. Acceso total (bypassa RLS).
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- authenticated: la app con sesion. RLS aisla por tenant.
grant select, insert, update, delete on
  public.agencies,
  public.brand_profiles,
  public.content_pieces,
  public.generation_logs
  to authenticated;
grant execute on function public.current_tenant_id() to authenticated;

-- Privilegios por defecto para objetos futuros creados por el rol actual,
-- para no tener que repetir GRANT en cada migracion nueva.
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role, authenticated;
