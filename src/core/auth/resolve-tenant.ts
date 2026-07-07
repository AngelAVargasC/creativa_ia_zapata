import 'server-only';
import { type TenantContext } from '@/core/tenant';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import { resolveSession } from '@/core/auth/resolve-session';

/**
 * Resuelve el tenant SIEMPRE desde la sesion autenticada en el servidor, para
 * flujos que EXIGEN una agencia (p.ej. generacion de contenido del solicitante).
 * El `tenant_id` vive en `app_metadata` (no editable por el cliente); nunca se
 * acepta desde el body/query. Para staff sin tenant, esto falla cerrada — usa
 * `resolveSession` si necesitas soportar admin/operador.
 */
export const resolveTenant = async (): Promise<Result<TenantContext, AppError>> => {
  const session = await resolveSession();
  if (!session.ok) return err(session.error);
  if (!session.value.tenantId) {
    return err(new AppError('TENANT_FORBIDDEN', 'El usuario no tiene un tenant valido'));
  }
  return ok({
    tenantId: session.value.tenantId,
    userId: session.value.userId,
    email: session.value.email,
  });
};
