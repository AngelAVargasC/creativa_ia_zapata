import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Prueba de aislamiento RLS de extremo a extremo.
 *
 * Requiere una instancia de Supabase con la migracion aplicada y el seed
 * ejecutado (2 agencias + 1 usuario por agencia con tenant_id en app_metadata).
 * Si el entorno no esta configurado, el bloque se SALTA para no romper la suite
 * offline. Cuando esta configurado, FALLA si el aislamiento se rompe.
 *
 *   node --env-file=.env.local scripts/seed.mts   # una vez
 *   node --env-file=.env.local node_modules/.bin/vitest run   # con env cargado
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const A_EMAIL = process.env.SEED_USER_A_EMAIL ?? 'a@creatiba.test';
const A_PASSWORD = process.env.SEED_USER_A_PASSWORD ?? 'Password123!';
const B_EMAIL = process.env.SEED_USER_B_EMAIL ?? 'b@creatiba.test';
const B_PASSWORD = process.env.SEED_USER_B_PASSWORD ?? 'Password123!';

const configured = Boolean(url && anon);

interface Ctx {
  readonly client: SupabaseClient;
  readonly tenantId: string;
  readonly userId: string;
}

const signIn = async (email: string, password: string): Promise<Ctx> => {
  const client = createClient(url as string, anon as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !auth.user) throw new Error(`login ${email}: ${error?.message ?? 'sin usuario'}`);

  // Bajo RLS, cada usuario solo ve SU agencia: la fila unica nos da su tenantId.
  const { data, error: e2 } = await client.from('agencies').select('id').single();
  if (e2 || !data) throw new Error(`tenant ${email}: ${e2?.message ?? 'sin agencia visible'}`);

  return { client, tenantId: (data as { id: string }).id, userId: auth.user.id };
};

describe.skipIf(!configured)('Aislamiento RLS entre tenants', () => {
  let a!: Ctx;
  let b!: Ctx;

  beforeAll(async () => {
    a = await signIn(A_EMAIL, A_PASSWORD);
    b = await signIn(B_EMAIL, B_PASSWORD);
    expect(a.tenantId).not.toBe(b.tenantId);
  });

  it('cada usuario solo ve su propia agencia', async () => {
    const ra = await a.client.from('agencies').select('id');
    const rb = await b.client.from('agencies').select('id');
    expect(ra.error).toBeNull();
    expect(rb.error).toBeNull();
    expect((ra.data as { id: string }[]) ?? []).toEqual([{ id: a.tenantId }]);
    expect((rb.data as { id: string }[]) ?? []).toEqual([{ id: b.tenantId }]);
  });

  it('A NO puede leer brand_profiles de B (ni B los de A)', async () => {
    const fromBView = await a.client.from('brand_profiles').select('*').eq('tenant_id', b.tenantId);
    const fromAView = await b.client.from('brand_profiles').select('*').eq('tenant_id', a.tenantId);
    expect(fromBView.error).toBeNull();
    expect(fromAView.error).toBeNull();
    expect(fromBView.data ?? []).toHaveLength(0);
    expect(fromAView.data ?? []).toHaveLength(0);
  });

  it('A NO puede ESCRIBIR content_pieces en el tenant de B (with check)', async () => {
    const { error } = await a.client.from('content_pieces').insert({
      tenant_id: b.tenantId,
      kind: 'copy',
      platform: 'facebook',
      status: 'draft',
      payload: { text: 'intento cross-tenant' },
      created_by: a.userId,
    });
    // La RLS (WITH CHECK) debe rechazar la escritura cruzada.
    expect(error).not.toBeNull();
  });

  it('B NO puede ESCRIBIR content_pieces en el tenant de A (with check)', async () => {
    const { error } = await b.client.from('content_pieces').insert({
      tenant_id: a.tenantId,
      kind: 'copy',
      platform: 'instagram',
      status: 'draft',
      payload: { text: 'intento cross-tenant' },
      created_by: b.userId,
    });
    expect(error).not.toBeNull();
  });

  it('cada usuario SI puede escribir en su propio tenant', async () => {
    const { error } = await a.client.from('content_pieces').insert({
      tenant_id: a.tenantId,
      kind: 'copy',
      platform: 'facebook',
      status: 'draft',
      payload: { text: 'pieza propia' },
      created_by: a.userId,
    });
    expect(error).toBeNull();
  });
});
