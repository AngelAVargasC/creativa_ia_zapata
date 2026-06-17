import { describe, it, expect } from 'vitest';
import { ok, err, type Result } from '@/core/result';
import { AppError } from '@/core/errors';
import { tenantIdSchema, type TenantContext } from '@/core/tenant';
import { buildTenantObjectPath } from '@/storage/path';
import type {
  DeleteObjectInput,
  PutObjectInput,
  SignedUrlInput,
  StoragePort,
  StoredObject,
} from '@/storage/ports';
import { storeTenantImage } from '@/storage/store-image';

const tenant: TenantContext = {
  tenantId: tenantIdSchema.parse('33333333-3333-3333-3333-333333333333'),
  userId: 'user-9',
};

/** Fake en memoria del puerto: aplica el mismo prefijado por tenant, sin red. */
const createFakeStorage = () => {
  const puts: PutObjectInput[] = [];
  const port: StoragePort = {
    async put(input: PutObjectInput): Promise<Result<StoredObject, AppError>> {
      const path = buildTenantObjectPath(input.tenantId, input.key);
      if (!path.ok) return path;
      puts.push(input);
      return ok({ key: input.key, path: path.value });
    },
    async getSignedUrl(input: SignedUrlInput): Promise<Result<string, AppError>> {
      const path = buildTenantObjectPath(input.tenantId, input.key);
      if (!path.ok) return path;
      return ok(`https://signed.example/${path.value}?sig=fake`);
    },
    async delete(_input: DeleteObjectInput): Promise<Result<void, AppError>> {
      return ok(undefined);
    },
  };
  return { port, puts };
};

describe('storeTenantImage', () => {
  it('guarda con ruta prefijada por tenant y devuelve URL firmada', async () => {
    const { port, puts } = createFakeStorage();
    const res = await storeTenantImage(port, {
      tenant,
      key: 'campanas/banner.png',
      body: new Uint8Array([1, 2, 3]),
      contentType: 'image/png',
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.path).toBe(`${tenant.tenantId}/campanas/banner.png`);
      expect(res.value.signedUrl).toContain(`${tenant.tenantId}/campanas/banner.png`);
    }
    expect(puts).toHaveLength(1);
    expect(puts[0]?.cacheControl).toContain('immutable');
  });

  it('propaga el error de validacion si la key intenta traversal', async () => {
    const { port } = createFakeStorage();
    const res = await storeTenantImage(port, {
      tenant,
      key: '../otro/secreto.png',
      body: 'x',
      contentType: 'image/png',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('propaga un fallo del proveedor sin enmascararlo', async () => {
    const failing: StoragePort = {
      async put() {
        return err(new AppError('PROVIDER_ERROR', 'R2 caido'));
      },
      async getSignedUrl() {
        return err(new AppError('PROVIDER_ERROR', 'no usado'));
      },
      async delete() {
        return ok(undefined);
      },
    };
    const res = await storeTenantImage(failing, {
      tenant,
      key: 'a.png',
      body: 'x',
      contentType: 'image/png',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('PROVIDER_ERROR');
  });
});
