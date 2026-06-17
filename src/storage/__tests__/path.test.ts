import { describe, it, expect } from 'vitest';
import { tenantIdSchema } from '@/core/tenant';
import { buildTenantObjectPath } from '@/storage/path';

const tenant = tenantIdSchema.parse('22222222-2222-2222-2222-222222222222');

describe('buildTenantObjectPath', () => {
  it('prefija siempre con el tenant', () => {
    const res = buildTenantObjectPath(tenant, 'campanas/banner.png');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(`${tenant}/campanas/banner.png`);
  });

  it('quita el slash inicial pero conserva la ruta', () => {
    const res = buildTenantObjectPath(tenant, '/img/a.png');
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toBe(`${tenant}/img/a.png`);
  });

  it('rechaza traversal (..)', () => {
    const res = buildTenantObjectPath(tenant, '../otro-tenant/secreto.png');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('rechaza backslashes y rutas absolutas de Windows', () => {
    expect(buildTenantObjectPath(tenant, 'a\\b.png').ok).toBe(false);
    expect(buildTenantObjectPath(tenant, 'C:\\x.png').ok).toBe(false);
  });

  it('rechaza key vacia o con segmentos vacios', () => {
    expect(buildTenantObjectPath(tenant, '   ').ok).toBe(false);
    expect(buildTenantObjectPath(tenant, 'a//b.png').ok).toBe(false);
  });
});
