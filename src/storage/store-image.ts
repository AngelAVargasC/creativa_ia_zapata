import { ok, type Result } from '@/core/result';
import type { AppError } from '@/core/errors';
import type { TenantContext } from '@/core/tenant';
import type { ObjectBody, StoragePort } from '@/storage/ports';

export interface StoreImageInput {
  /** Tenant ya resuelto desde la sesion del servidor. */
  readonly tenant: TenantContext;
  /** Ruta relativa dentro del tenant (sin prefijo). */
  readonly key: string;
  readonly body: ObjectBody;
  readonly contentType: string;
  /** TTL de la URL firmada que se devuelve para servir la imagen. */
  readonly signedUrlTtlSeconds?: number;
}

export interface StoredImage {
  /** Ruta completa (prefijada por tenant) para persistir como referencia. */
  readonly path: string;
  /** URL firmada para servir la imagen sin exponer el bucket. */
  readonly signedUrl: string;
}

/**
 * Helper de aplicacion sobre el `StoragePort`: guarda una imagen del tenant y
 * devuelve su ruta + una URL firmada para servirla. Intercambiable de proveedor
 * (R2 hoy) porque solo depende del puerto.
 */
export const storeTenantImage = async (
  storage: StoragePort,
  input: StoreImageInput,
): Promise<Result<StoredImage, AppError>> => {
  const put = await storage.put({
    tenantId: input.tenant.tenantId,
    key: input.key,
    body: input.body,
    contentType: input.contentType,
    // Las imagenes generadas son inmutables: cache agresivo.
    cacheControl: 'public, max-age=31536000, immutable',
  });
  if (!put.ok) return put;

  const signed = await storage.getSignedUrl({
    tenantId: input.tenant.tenantId,
    key: input.key,
    expiresInSeconds: input.signedUrlTtlSeconds,
  });
  if (!signed.ok) return signed;

  return ok({ path: put.value.path, signedUrl: signed.value });
};
