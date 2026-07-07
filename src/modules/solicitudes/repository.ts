import 'server-only';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { SolicitudRow, SolicitudWithAgency, SolicitudEvento } from './types';
import type { CreateSolicitudInput, SolicitanteUpdateInput, StaffUpdateInput } from './schema';

/**
 * Acceso a datos de solicitudes. SIEMPRE via el cliente con sesion (RLS): la
 * visibilidad y los permisos por rol/tenant los gobierna la BD (migraciones
 * 0003/0004), no este codigo. Aqui solo mapeamos y normalizamos errores.
 */

type AgencyEmbed = { name: string } | { name: string }[] | null;

const withAgencyName = (row: SolicitudRow & { agencies?: AgencyEmbed }): SolicitudWithAgency => {
  const embed = row.agencies;
  const nombre = Array.isArray(embed) ? embed[0]?.name : embed?.name;
  return { ...row, agencia_nombre: nombre ?? '—' };
};

/** Lista solicitudes visibles para la sesion (RLS decide el alcance). */
export const listSolicitudes = async (): Promise<Result<SolicitudWithAgency[], AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, agencies(name)')
    .order('created_at', { ascending: false });
  if (error) return err(new AppError('UNKNOWN', `No se pudieron cargar las solicitudes: ${error.message}`));
  return ok(((data ?? []) as (SolicitudRow & { agencies?: AgencyEmbed })[]).map(withAgencyName));
};

/** Una solicitud por id (RLS: null si no es visible para la sesion). */
export const getSolicitud = async (id: string): Promise<Result<SolicitudWithAgency, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('solicitudes')
    .select('*, agencies(name)')
    .eq('id', id)
    .maybeSingle();
  if (error) return err(new AppError('UNKNOWN', error.message));
  if (!data) return err(new AppError('NOT_FOUND', 'Solicitud no encontrada'));
  return ok(withAgencyName(data as SolicitudRow & { agencies?: AgencyEmbed }));
};

/** Bitacora de cambios de una solicitud (mas reciente primero). */
export const listEventos = async (solicitudId: string): Promise<Result<SolicitudEvento[], AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('solicitud_eventos')
    .select('*')
    .eq('solicitud_id', solicitudId)
    .order('created_at', { ascending: false });
  if (error) return err(new AppError('UNKNOWN', error.message));
  return ok((data ?? []) as SolicitudEvento[]);
};

/** Crea una solicitud para `tenantId`. RLS (with check) valida que sea permitido. */
export const createSolicitud = async (
  tenantId: string,
  input: CreateSolicitudInput,
): Promise<Result<SolicitudRow, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('solicitudes')
    .insert({ tenant_id: tenantId, ...input })
    .select('*')
    .single();
  if (error) return err(new AppError('TENANT_FORBIDDEN', `No se pudo crear la solicitud: ${error.message}`));
  return ok(data as SolicitudRow);
};

/** Actualiza campos propios (solicitante). Los triggers rechazan lo no permitido. */
export const updateSolicitudSolicitante = async (
  id: string,
  patch: SolicitanteUpdateInput,
): Promise<Result<SolicitudRow, AppError>> => update(id, patch);

/** Actualiza status/link_final y datos (staff). */
export const updateSolicitudStaff = async (
  id: string,
  patch: StaffUpdateInput,
): Promise<Result<SolicitudRow, AppError>> => update(id, patch);

const update = async (
  id: string,
  patch: Record<string, unknown>,
): Promise<Result<SolicitudRow, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('solicitudes')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return err(new AppError('TENANT_FORBIDDEN', error.message));
  return ok(data as SolicitudRow);
};

/** Elimina una solicitud (RLS: staff, o dueño mientras 'nueva'). */
export const deleteSolicitud = async (id: string): Promise<Result<true, AppError>> => {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('solicitudes').delete().eq('id', id);
  if (error) return err(new AppError('TENANT_FORBIDDEN', error.message));
  return ok(true);
};
