import 'server-only';
import { getSupabaseAdminClient } from '@/db/supabase-admin';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { RegisterInput } from './schema';

export interface AvailableAgency {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
}

/** slug estable a partir del nombre (sin acentos, kebab-case). */
const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Agencias del catalogo aun SIN cuenta (disponibles para reclamarse). Usa el
 * service role (lectura del catalogo publico para el select de registro).
 */
export const listAvailableAgencies = async (): Promise<AvailableAgency[]> => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('agencies')
    .select('id, name, address')
    .is('user_id', null)
    .order('name');
  if (error) throw new AppError('UNKNOWN', `No se pudo cargar el catalogo: ${error.message}`);
  return (data ?? []) as AvailableAgency[];
};

/**
 * Registra una agencia + su usuario solicitante (1:1). Idempotencia y
 * concurrencia protegidas por la columna UNIQUE `agencies.user_id`: si dos
 * intentos reclaman la misma agencia, el segundo falla al vincular y se hace
 * rollback del usuario para no dejar cuentas huerfanas.
 */
export const registerAgency = async (input: RegisterInput): Promise<Result<true, AppError>> => {
  const admin = getSupabaseAdminClient();

  // 1) Resolver el tenant destino (existente o nuevo), exigiendo que no tenga ya cuenta.
  let tenantId: string;
  if (input.mode === 'existing') {
    const { data, error } = await admin
      .from('agencies')
      .select('id, user_id')
      .eq('id', input.agencyId as string)
      .maybeSingle();
    if (error) return err(new AppError('UNKNOWN', error.message));
    if (!data) return err(new AppError('NOT_FOUND', 'La agencia seleccionada no existe'));
    if ((data as { user_id: string | null }).user_id) {
      return err(new AppError('TENANT_FORBIDDEN', 'Esa agencia ya tiene una cuenta. Contacta al operador.'));
    }
    tenantId = (data as { id: string }).id;
  } else {
    const slug = slugify(input.nombre as string);
    const { data: existing, error: e1 } = await admin
      .from('agencies')
      .select('id, user_id')
      .eq('slug', slug)
      .maybeSingle();
    if (e1) return err(new AppError('UNKNOWN', e1.message));
    if (existing) {
      if ((existing as { user_id: string | null }).user_id) {
        return err(new AppError('TENANT_FORBIDDEN', 'Ya existe una agencia con ese nombre y tiene cuenta.'));
      }
      tenantId = (existing as { id: string }).id;
    } else {
      const { data: created, error: e2 } = await admin
        .from('agencies')
        .insert({ name: input.nombre, slug, address: input.address ?? null })
        .select('id')
        .single();
      if (e2) return err(new AppError('UNKNOWN', `No se pudo crear la agencia: ${e2.message}`));
      tenantId = (created as { id: string }).id;
    }
  }

  // 2) Crear el usuario solicitante con rol + tenant en app_metadata.
  const { data: userData, error: uErr } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: { role: 'solicitante', tenant_id: tenantId },
  });
  if (uErr) return err(new AppError('TENANT_FORBIDDEN', `No se pudo crear la cuenta: ${uErr.message}`));
  const userId = userData.user?.id;
  if (!userId) return err(new AppError('UNKNOWN', 'No se pudo crear la cuenta'));

  // 3) Vincular 1:1. Si falla (agencia reclamada en paralelo), rollback del usuario.
  const { error: linkErr } = await admin.from('agencies').update({ user_id: userId }).eq('id', tenantId);
  if (linkErr) {
    await admin.auth.admin.deleteUser(userId);
    return err(new AppError('TENANT_FORBIDDEN', 'Esa agencia acaba de ser reclamada. Intenta de nuevo.'));
  }

  return ok(true);
};
