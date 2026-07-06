import { z } from 'zod';

/**
 * TenantId es un UUID "branded": evita mezclar por accidente un id de tenant
 * con cualquier otro string. El tenant SIEMPRE se resuelve en el servidor.
 */
export const tenantIdSchema = z.string().uuid().brand<'TenantId'>();
export type TenantId = z.infer<typeof tenantIdSchema>;

/** Contexto de identidad resuelto en servidor a partir de la sesion autenticada. */
export interface TenantContext {
  readonly tenantId: TenantId;
  readonly userId: string;
  readonly email?: string;
}
