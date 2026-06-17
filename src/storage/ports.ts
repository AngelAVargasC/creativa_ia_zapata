import type { Result } from '@/core/result';
import type { AppError } from '@/core/errors';
import type { TenantId } from '@/core/tenant';

/**
 * Cuerpo de un objeto. Para imagenes generadas usamos binario (Uint8Array);
 * tambien admitimos string para contenidos de texto.
 */
export type ObjectBody = Uint8Array | string;

export interface PutObjectInput {
  /** Tenant resuelto en servidor (branded). El cliente nunca lo provee. */
  readonly tenantId: TenantId;
  /** Ruta relativa dentro del tenant (sin prefijo). p.ej. "campanas/x.png". */
  readonly key: string;
  readonly body: ObjectBody;
  readonly contentType: string;
  readonly cacheControl?: string;
}

export interface StoredObject {
  /** Ruta relativa tal cual la dio el caller (sin prefijo de tenant). */
  readonly key: string;
  /** Ruta completa del objeto, siempre prefijada por tenant: `{tenantId}/...`. */
  readonly path: string;
  /** URL publica (si hay base publica configurada). Solo para assets no sensibles. */
  readonly publicUrl?: string;
}

export interface SignedUrlInput {
  readonly tenantId: TenantId;
  readonly key: string;
  /** TTL de la URL firmada en segundos (por defecto 900 = 15 min). */
  readonly expiresInSeconds?: number;
}

export interface DeleteObjectInput {
  readonly tenantId: TenantId;
  readonly key: string;
}

/**
 * Puerto de almacenamiento de objetos. El dominio depende de esta interfaz,
 * nunca de un proveedor concreto. Cambiar de proveedor = nuevo adapter.
 *
 * Toda operacion lleva `tenantId`: las rutas se prefijan por tenant y nunca se
 * confia en el cliente para el tenant ni para la ruta.
 */
export interface StoragePort {
  put(input: PutObjectInput): Promise<Result<StoredObject, AppError>>;
  getSignedUrl(input: SignedUrlInput): Promise<Result<string, AppError>>;
  delete(input: DeleteObjectInput): Promise<Result<void, AppError>>;
}
