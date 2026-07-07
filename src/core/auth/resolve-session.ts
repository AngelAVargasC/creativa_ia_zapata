import 'server-only';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { appRoleSchema, tenantIdSchema, type SessionContext } from '@/core/tenant';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';

/**
 * Resuelve la sesion completa (rol + tenant) SIEMPRE desde la sesion
 * autenticada en el servidor. Rol y tenant viven en `app_metadata` (no
 * editables por el cliente). Nunca se aceptan desde el body/query.
 *
 * Falla cerrada: si no se puede verificar la identidad, deniega.
 */
export const resolveSession = async (): Promise<Result<SessionContext, AppError>> => {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return err(new AppError('TENANT_FORBIDDEN', 'No autenticado'));
    }

    const meta = data.user.app_metadata as Record<string, unknown>;

    // Rol: por defecto 'solicitante' para usuarios previos (seed) sin claim de rol.
    const roleParsed = appRoleSchema.safeParse(meta.role ?? 'solicitante');
    if (!roleParsed.success) {
      return err(new AppError('TENANT_FORBIDDEN', 'El usuario tiene un rol invalido'));
    }
    const role = roleParsed.data;

    const tenantParsed = tenantIdSchema.safeParse(meta.tenant_id);
    const tenantId = tenantParsed.success ? tenantParsed.data : undefined;

    // Un solicitante DEBE tener tenant; staff (admin/operador) puede no tenerlo.
    if (role === 'solicitante' && !tenantId) {
      return err(new AppError('TENANT_FORBIDDEN', 'El usuario no tiene un tenant valido'));
    }

    return ok({ userId: data.user.id, email: data.user.email ?? undefined, role, tenantId });
  } catch (e) {
    return err(new AppError('TENANT_FORBIDDEN', 'No se pudo verificar la sesion', e));
  }
};
