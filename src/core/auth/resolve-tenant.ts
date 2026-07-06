import 'server-only';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { tenantIdSchema, type TenantContext } from '@/core/tenant';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';

/**
 * Resuelve el tenant SIEMPRE desde la sesion autenticada en el servidor.
 * El `tenant_id` vive en `app_metadata` del usuario (no editable por el cliente).
 * Nunca se acepta el tenant desde el body/query de la peticion.
 */
export const resolveTenant = async (): Promise<Result<TenantContext, AppError>> => {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return err(new AppError('TENANT_FORBIDDEN', 'No autenticado'));
    }

    const meta = data.user.app_metadata as Record<string, unknown>;
    const parsed = tenantIdSchema.safeParse(meta.tenant_id);
    if (!parsed.success) {
      return err(new AppError('TENANT_FORBIDDEN', 'El usuario no tiene un tenant valido'));
    }

    return ok({ tenantId: parsed.data, userId: data.user.id, email: data.user.email });
  } catch (e) {
    // Falla cerrada: si no podemos verificar identidad, denegamos.
    return err(new AppError('TENANT_FORBIDDEN', 'No se pudo verificar la sesion', e));
  }
};
