import { z } from 'zod';

/**
 * TenantId es un UUID "branded": evita mezclar por accidente un id de tenant
 * con cualquier otro string. El tenant SIEMPRE se resuelve en el servidor.
 */
export const tenantIdSchema = z.string().uuid().brand<'TenantId'>();
export type TenantId = z.infer<typeof tenantIdSchema>;

/**
 * Rol de la cuenta. Vive en el JWT (app_metadata.role), no editable por el
 * cliente; lo setea el backend (service role). Ver migracion 0003.
 *   admin       → CRUD de operadores; ve todo.
 *   operador    → gestiona todas las solicitudes.
 *   solicitante → agencia; solo lo suyo.
 */
export const appRoleSchema = z.enum(['admin', 'operador', 'solicitante']);
export type AppRole = z.infer<typeof appRoleSchema>;

/** admin y operador cruzan tenants (ven todas las agencias). */
export const isStaffRole = (role: AppRole): boolean => role === 'admin' || role === 'operador';

/** Contexto de identidad resuelto en servidor a partir de la sesion autenticada. */
export interface TenantContext {
  readonly tenantId: TenantId;
  readonly userId: string;
  readonly email?: string;
}

/**
 * Sesion completa (rol + tenant opcional). El `tenantId` es obligatorio para
 * `solicitante` y puede estar ausente para staff (admin/operador).
 */
export interface SessionContext {
  readonly userId: string;
  readonly email?: string;
  readonly role: AppRole;
  readonly tenantId?: TenantId;
}
