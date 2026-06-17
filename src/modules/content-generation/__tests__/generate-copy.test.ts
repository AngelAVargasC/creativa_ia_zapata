import { describe, it, expect } from 'vitest';
import { createLogger } from '@/core/logging/logger';
import { ok, err } from '@/core/result';
import { AppError } from '@/core/errors';
import { tenantIdSchema, type TenantContext } from '@/core/tenant';
import type { GenerationResult, LanguageModelPort, UsageInfo } from '@/ai/ports';
import { generateCopy } from '../domain/generate-copy';
import type { BrandProfile, CopyBrief } from '../domain/copy';

const usage: UsageInfo = {
  provider: 'fake',
  model: 'fake-1',
  inputTokens: 10,
  outputTokens: 20,
  latencyMs: 1,
};

/** Fake del puerto: deterministico y offline, sin tocar ningun SDK ni red. */
const fakeModel = (result: GenerationResult | AppError): LanguageModelPort => ({
  async generate() {
    return result instanceof AppError ? err(result) : ok(result);
  },
  async stream() {
    return err(new AppError('PROVIDER_ERROR', 'no usado en estos tests'));
  },
});

const logger = createLogger();
const tenant: TenantContext = {
  tenantId: tenantIdSchema.parse('11111111-1111-1111-1111-111111111111'),
  userId: 'user-1',
};
const brand: BrandProfile = { agencyName: 'Zapata', voice: 'clara', bannedWords: ['gratis'] };
const brief: CopyBrief = {
  platform: 'facebook',
  objective: 'vender',
  tone: 'cercano',
  product: 'cafe',
  maxChars: 100,
};

describe('generateCopy', () => {
  it('devuelve el copy cuando cumple las reglas de marca', async () => {
    const model = fakeModel({ text: '  Despierta con sabor  ', usage });
    const res = await generateCopy({ model, logger }, { tenant, brand, brief });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.text).toBe('Despierta con sabor'); // recortado
      expect(res.value.usage.provider).toBe('fake');
    }
  });

  it('rechaza con VALIDATION si el copy contiene una palabra prohibida', async () => {
    const model = fakeModel({ text: 'Hoy todo gratis', usage });
    const res = await generateCopy({ model, logger }, { tenant, brand, brief });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('rechaza con VALIDATION si el copy excede el limite de caracteres', async () => {
    const model = fakeModel({ text: 'a'.repeat(101), usage });
    const res = await generateCopy({ model, logger }, { tenant, brand, brief });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('VALIDATION');
  });

  it('propaga el error del proveedor sin enmascararlo', async () => {
    const model = fakeModel(new AppError('PROVIDER_ERROR', 'caido'));
    const res = await generateCopy({ model, logger }, { tenant, brand, brief });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('PROVIDER_ERROR');
  });
});
