import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Pruebas e2e de permisos por rol y auditoria sobre `solicitudes`.
 *
 * Requiere Supabase con migraciones 0003/0004 aplicadas y el seed ejecutado
 * (2 agencias solicitantes A/B + 1 operador). Se SALTA si el entorno no esta
 * configurado; cuando lo esta, FALLA si los permisos o la bitacora se rompen.
 *
 *   node --env-file=.env.local scripts/seed.mts
 *   node --env-file=.env.local node_modules/.bin/vitest run
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const A_EMAIL = process.env.SEED_USER_A_EMAIL ?? 'a@creatiba.test';
const A_PASSWORD = process.env.SEED_USER_A_PASSWORD ?? 'Password123!';
const B_EMAIL = process.env.SEED_USER_B_EMAIL ?? 'b@creatiba.test';
const B_PASSWORD = process.env.SEED_USER_B_PASSWORD ?? 'Password123!';
const OP_EMAIL = process.env.SEED_OPERADOR_EMAIL ?? 'operador@creatiba.test';
const OP_PASSWORD = process.env.SEED_OPERADOR_PASSWORD ?? 'Password123!';

const configured = Boolean(url && anon);

interface Ctx {
  readonly client: SupabaseClient;
  readonly tenantId: string | null;
}

const signIn = async (email: string, password: string): Promise<Ctx> => {
  const client = createClient(url as string, anon as string, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error(`login ${email}: ${error?.message ?? 'sin usuario'}`);
  const tenantId = (data.user.app_metadata as { tenant_id?: string }).tenant_id ?? null;
  return { client, tenantId };
};

describe.skipIf(!configured)('Solicitudes · permisos por rol y auditoria', () => {
  let a!: Ctx;
  let b!: Ctx;
  let op!: Ctx;
  let solicitudId!: string;

  beforeAll(async () => {
    a = await signIn(A_EMAIL, A_PASSWORD);
    b = await signIn(B_EMAIL, B_PASSWORD);
    op = await signIn(OP_EMAIL, OP_PASSWORD);

    // La agencia A crea una solicitud para su propio tenant.
    const { data, error } = await a.client
      .from('solicitudes')
      .insert({ tenant_id: a.tenantId, tipo_contenido: 'Posteo de feed (test)' })
      .select('id')
      .single();
    if (error || !data) throw new Error(`crear solicitud A: ${error?.message ?? 'sin id'}`);
    solicitudId = (data as { id: string }).id;
  });

  it('la agencia B NO ve la solicitud de A', async () => {
    const { data, error } = await b.client.from('solicitudes').select('id').eq('id', solicitudId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it('el operador SÍ ve la solicitud de A (cruza tenants)', async () => {
    const { data, error } = await op.client.from('solicitudes').select('id, tenant_id').eq('id', solicitudId);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(1);
  });

  it('la agencia NO puede cambiar status ni link_final (trigger lo rechaza)', async () => {
    const { error } = await a.client
      .from('solicitudes')
      .update({ status: 'publicada' })
      .eq('id', solicitudId);
    expect(error).not.toBeNull();
  });

  it('la agencia SÍ puede editar sus datos mientras está «nueva»', async () => {
    const { error } = await a.client
      .from('solicitudes')
      .update({ descripcion: 'Descripción actualizada por la agencia' })
      .eq('id', solicitudId);
    expect(error).toBeNull();
  });

  it('el operador puede cambiar status y link_final', async () => {
    const { error } = await op.client
      .from('solicitudes')
      .update({ status: 'en_proceso', link_final: 'https://ejemplo.mx/post' })
      .eq('id', solicitudId);
    expect(error).toBeNull();
  });

  it('la bitácora registró el cambio de status por el operador', async () => {
    const { data, error } = await op.client
      .from('solicitud_eventos')
      .select('field, old_value, new_value, changed_role, action')
      .eq('solicitud_id', solicitudId)
      .eq('field', 'status');
    expect(error).toBeNull();
    const rows = (data ?? []) as { new_value: string; changed_role: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows.some((r) => r.new_value === 'en_proceso' && r.changed_role === 'operador')).toBe(true);
  });

  it('la bitácora es inmutable: la agencia no puede insertar eventos a mano', async () => {
    const { error } = await a.client.from('solicitud_eventos').insert({
      solicitud_id: solicitudId,
      tenant_id: a.tenantId,
      action: 'update',
      field: 'status',
      new_value: 'publicada',
    });
    expect(error).not.toBeNull();
  });
});
