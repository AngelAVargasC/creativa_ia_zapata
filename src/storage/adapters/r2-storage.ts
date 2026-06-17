import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as presignUrl } from '@aws-sdk/s3-request-presigner';

import type { ServerEnv } from '@/config/env';
import type { Logger } from '@/core/logging/logger';
import { AppError, toAppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import { buildTenantObjectPath } from '@/storage/path';
import {
  type DeleteObjectInput,
  type PutObjectInput,
  type SignedUrlInput,
  type StoragePort,
  type StoredObject,
} from '@/storage/ports';

interface R2Deps {
  readonly env: ServerEnv;
  readonly logger: Logger;
}

const DEFAULT_SIGNED_URL_TTL = 900; // 15 min

/**
 * Adapter de almacenamiento sobre Cloudflare R2 (S3-compatible) via AWS SDK v3.
 * Implementa el `StoragePort`: el dominio nunca ve esta clase. Si falta config
 * de R2, falla rapido con PROVIDER_UNAVAILABLE.
 *
 * Todas las rutas se prefijan por tenant (`{tenantId}/...`) y se sirven por URL
 * firmada; el tenant llega ya resuelto desde la sesion (tipo branded TenantId).
 */
export const createR2StorageAdapter = (deps: R2Deps): StoragePort => {
  const { env, logger } = deps;

  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET
  ) {
    throw new AppError('PROVIDER_UNAVAILABLE', 'Cloudflare R2 no configurado');
  }

  const bucket = env.R2_BUCKET;
  const publicBase = env.R2_PUBLIC_BASE_URL;

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return {
    async put(input: PutObjectInput): Promise<Result<StoredObject, AppError>> {
      const path = buildTenantObjectPath(input.tenantId, input.key);
      if (!path.ok) return path;
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: path.value,
            Body: input.body,
            ContentType: input.contentType,
            CacheControl: input.cacheControl,
          }),
        );
        return ok({
          key: input.key,
          path: path.value,
          publicUrl: publicBase ? `${publicBase.replace(/\/+$/, '')}/${path.value}` : undefined,
        });
      } catch (e) {
        const error = toAppError(e, 'PROVIDER_ERROR');
        logger.error('storage.put.failed', { path: path.value, code: error.code });
        return err(error);
      }
    },

    async getSignedUrl(input: SignedUrlInput): Promise<Result<string, AppError>> {
      const path = buildTenantObjectPath(input.tenantId, input.key);
      if (!path.ok) return path;
      try {
        const url = await presignUrl(
          client,
          new GetObjectCommand({ Bucket: bucket, Key: path.value }),
          { expiresIn: input.expiresInSeconds ?? DEFAULT_SIGNED_URL_TTL },
        );
        return ok(url);
      } catch (e) {
        const error = toAppError(e, 'PROVIDER_ERROR');
        logger.error('storage.sign.failed', { path: path.value, code: error.code });
        return err(error);
      }
    },

    async delete(input: DeleteObjectInput): Promise<Result<void, AppError>> {
      const path = buildTenantObjectPath(input.tenantId, input.key);
      if (!path.ok) return path;
      try {
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: path.value }));
        return ok(undefined);
      } catch (e) {
        const error = toAppError(e, 'PROVIDER_ERROR');
        logger.error('storage.delete.failed', { path: path.value, code: error.code });
        return err(error);
      }
    },
  };
};
