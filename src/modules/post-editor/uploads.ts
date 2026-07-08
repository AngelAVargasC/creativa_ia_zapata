import 'server-only';
import { loadServerEnv } from '@/config/env';
import { createLogger } from '@/core/logging/logger';
import { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import { createR2StorageAdapter } from '@/storage/adapters/r2-storage';
import type { TenantId } from '@/core/tenant';

/** Id corto y único para el nombre del objeto. */
const objectId = (): string => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** ¿Está R2 configurado? (para degradar con gracia si no). */
export const isR2Configured = (): boolean => {
  const env = loadServerEnv();
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_BASE_URL,
  );
};

/**
 * Sube una imagen (dataURL o base64 puro) a R2 y devuelve su URL pública estable.
 * Las imágenes del estudio no son sensibles (se publican), por eso van a la base
 * pública. Organizadas bajo `posts/`.
 */
export const uploadImage = async (dataUrlOrB64: string, folder = 'posts'): Promise<Result<string, AppError>> => {
  const env = loadServerEnv();
  if (!env.R2_PUBLIC_BASE_URL) {
    return err(new AppError('PROVIDER_UNAVAILABLE', 'Falta R2_PUBLIC_BASE_URL para servir las imágenes.'));
  }

  const match = /^data:(image\/[\w.+-]+);base64,(.*)$/s.exec(dataUrlOrB64);
  const contentType = match?.[1] ?? 'image/png';
  const base64 = match?.[2] ?? dataUrlOrB64;

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(Buffer.from(base64, 'base64'));
  } catch {
    return err(new AppError('VALIDATION', 'Imagen inválida'));
  }
  if (bytes.byteLength === 0) return err(new AppError('VALIDATION', 'Imagen vacía'));

  const ext = (contentType.split('/')[1] ?? 'png').replace('+xml', '');
  const key = `${objectId()}.${ext}`;

  const storage = createR2StorageAdapter({ env, logger: createLogger({ module: 'uploads' }) });
  const put = await storage.put({
    tenantId: folder as unknown as TenantId, // prefijo de carpeta (no es un tenant real)
    key,
    body: bytes,
    contentType,
    cacheControl: 'public, max-age=31536000, immutable',
  });
  if (!put.ok) return put;
  if (!put.value.publicUrl) {
    return err(new AppError('PROVIDER_UNAVAILABLE', 'R2 sin URL pública configurada.'));
  }
  return ok(put.value.publicUrl);
};
