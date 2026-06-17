import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import type { TenantId } from '@/core/tenant';

/**
 * Construye la ruta completa de un objeto, SIEMPRE prefijada por tenant:
 * `{tenantId}/{key}`. Pura y deterministica.
 *
 * Rechaza rutas peligrosas (traversal, absolutas, backslashes) para que un
 * `key` no pueda escapar del prefijo del tenant ni cruzar a otro tenant.
 */
export const buildTenantObjectPath = (tenantId: TenantId, key: string): Result<string, AppError> => {
  const relative = key.replace(/^\/+/, '').trim();

  if (relative.length === 0) {
    return err(new AppError('VALIDATION', 'La key del objeto no puede estar vacia'));
  }
  if (
    relative.includes('..') || // traversal
    relative.includes('\\') || // separador Windows / escape
    /^[a-zA-Z]:/.test(relative) || // ruta absoluta Windows (C:\...)
    relative.split('/').some((segment) => segment.length === 0) // // dobles o trailing
  ) {
    return err(new AppError('VALIDATION', `Key de objeto invalida: ${key}`));
  }

  return ok(`${tenantId}/${relative}`);
};
