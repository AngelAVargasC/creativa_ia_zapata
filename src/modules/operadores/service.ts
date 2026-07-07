import 'server-only';
import { getSupabaseAdminClient } from '@/db/supabase-admin';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';

export interface Operador {
  readonly id: string;
  readonly email: string;
  readonly createdAt: string;
  readonly lastSignInAt: string | null;
  readonly active: boolean;
}

/** Campos de auth.users que consultamos (el tipo de supabase-js no expone banned_until). */
type RawUser = {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  app_metadata?: Record<string, unknown>;
};

const isActive = (bannedUntil?: string | null): boolean =>
  !bannedUntil || new Date(bannedUntil).getTime() <= Date.now();

/** Lista todos los usuarios con rol operador (paginando auth.users). */
export const listOperadores = async (): Promise<Result<Operador[], AppError>> => {
  const admin = getSupabaseAdminClient();
  const out: Operador[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return err(new AppError('UNKNOWN', `No se pudieron listar operadores: ${error.message}`));
    for (const raw of data.users as unknown as RawUser[]) {
      if (raw.app_metadata?.role === 'operador') {
        out.push({
          id: raw.id,
          email: raw.email ?? '',
          createdAt: raw.created_at,
          lastSignInAt: raw.last_sign_in_at ?? null,
          active: isActive(raw.banned_until),
        });
      }
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  out.sort((a, b) => a.email.localeCompare(b.email));
  return ok(out);
};

/** Crea un operador con contraseña temporal. */
export const createOperador = async (email: string, password: string): Promise<Result<true, AppError>> => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: 'operador' },
  });
  if (error) return err(new AppError('TENANT_FORBIDDEN', `No se pudo crear el operador: ${error.message}`));
  return ok(true);
};

/**
 * Activa/desactiva un operador. Desactivar = ban muy largo (conserva la cuenta y
 * su rastro en la bitacora, a diferencia de eliminar). Reactivar = quitar el ban.
 */
export const setOperadorActive = async (id: string, active: boolean): Promise<Result<true, AppError>> => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: active ? 'none' : '876000h',
  } as { ban_duration: string });
  if (error) return err(new AppError('UNKNOWN', error.message));
  return ok(true);
};

/** Elimina definitivamente un operador. */
export const deleteOperador = async (id: string): Promise<Result<true, AppError>> => {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return err(new AppError('UNKNOWN', error.message));
  return ok(true);
};
