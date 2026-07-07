/**
 * Seed idempotente.
 *
 * Crea/actualiza:
 *   - 1 usuario ADMIN y 1 OPERADOR (staff, sin tenant; rol en app_metadata).
 *   - El catalogo de 27 agencias Go On (scripts/data/go-on-agencies.json),
 *     SIN usuario (disponibles para reclamarse via /registro).
 *   - 2 agencias demo con brand_profile y 1 usuario solicitante cada una.
 *
 * El `role` y el `tenant_id` viven en `app_metadata` (de donde los lee la RLS
 * via el JWT). Reejecutable sin duplicar: agencies por `slug`, brand_profiles
 * por `tenant_id`, usuarios por email.
 *
 * Uso (requiere service role; nunca se expone al cliente):
 *   node --env-file=.env.local scripts/seed.mts
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient, type User } from '@supabase/supabase-js';

type AppRole = 'admin' | 'operador' | 'solicitante';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  process.exit(1);
}

const admin = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Decodifica el rol de un JWT de Supabase (anon / service_role). null si no es JWT. */
const decodeJwtRole = (key: string): string | null => {
  const parts = key.split('.');
  if (parts.length !== 3 || !parts[1]) return null; // p.ej. llave nueva sb_secret_...
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload && typeof payload === 'object' && 'role' in payload) {
      const role = (payload as { role: unknown }).role;
      return typeof role === 'string' ? role : null;
    }
    return null;
  } catch {
    return null;
  }
};

/** El seed DEBE usar la service_role (ignora RLS y tiene privilegios totales). */
const assertServiceRole = (key: string): void => {
  const role = decodeJwtRole(key);
  if (role && role !== 'service_role') {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY tiene rol "${role}", no "service_role". ` +
        'Usa la llave service_role: Dashboard -> Project Settings -> API -> service_role (secret).',
    );
  }
  console.log(
    role
      ? `Llave service_role verificada (rol: ${role}).`
      : 'Llave en formato nuevo (sb_secret_...): no se verifica el rol localmente.',
  );
};

interface SeedAgency {
  readonly slug: string;
  readonly name: string;
  readonly voice: string;
  readonly bannedWords: readonly string[];
  readonly userEmail: string;
  readonly userPassword: string;
}

const AGENCIES: readonly SeedAgency[] = [
  {
    slug: 'agencia-a',
    name: 'Agencia A',
    voice: 'cercana, optimista y clara',
    bannedWords: ['gratis'],
    userEmail: process.env.SEED_USER_A_EMAIL ?? 'a@creatiba.test',
    userPassword: process.env.SEED_USER_A_PASSWORD ?? 'Password123!',
  },
  {
    slug: 'agencia-b',
    name: 'Agencia B',
    voice: 'profesional, sobria y precisa',
    bannedWords: ['barato'],
    userEmail: process.env.SEED_USER_B_EMAIL ?? 'b@creatiba.test',
    userPassword: process.env.SEED_USER_B_PASSWORD ?? 'Password123!',
  },
];

const upsertAgency = async (a: SeedAgency): Promise<string> => {
  const { data, error } = await admin
    .from('agencies')
    .upsert({ name: a.name, slug: a.slug }, { onConflict: 'slug' })
    .select('id')
    .single();
  if (error) throw new Error(`agencies upsert (${a.slug}): ${error.message}`);
  const row = data as { id: string } | null;
  if (!row) throw new Error(`agencies upsert (${a.slug}): sin id`);
  return row.id;
};

const upsertBrandProfile = async (tenantId: string, a: SeedAgency): Promise<void> => {
  const { error } = await admin
    .from('brand_profiles')
    .upsert(
      { tenant_id: tenantId, voice: a.voice, banned_words: a.bannedWords },
      { onConflict: 'tenant_id' },
    );
  if (error) throw new Error(`brand_profiles upsert (${a.slug}): ${error.message}`);
};

const findUserByEmail = async (email: string): Promise<User | null> => {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const found = data.users.find((u) => u.email === email);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
};

/** Crea/actualiza un usuario con su rol (+ tenant si es solicitante). Devuelve el id. */
const upsertUserWithRole = async (
  email: string,
  password: string,
  role: AppRole,
  tenantId: string | null,
): Promise<string> => {
  const appMetadata: Record<string, unknown> = { role };
  if (tenantId) appMetadata.tenant_id = tenantId;

  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      app_metadata: appMetadata,
    });
    if (error) throw new Error(`updateUser (${email}): ${error.message}`);
    console.log(`= usuario ${email} actualizado (rol ${role}${tenantId ? `, tenant ${tenantId}` : ''})`);
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
  });
  if (error) throw new Error(`createUser (${email}): ${error.message}`);
  if (!data.user) throw new Error(`createUser (${email}): sin usuario en la respuesta`);
  console.log(`+ usuario ${email} creado (rol ${role}${tenantId ? `, tenant ${tenantId}` : ''})`);
  return data.user.id;
};

/** Liga el usuario solicitante a su agencia (relacion 1:1, columna unica). */
const linkAgencyUser = async (tenantId: string, userId: string): Promise<void> => {
  const { error } = await admin.from('agencies').update({ user_id: userId }).eq('id', tenantId);
  if (error) throw new Error(`agencies.user_id (${tenantId}): ${error.message}`);
};

// ── Staff (admin + operador). Sin tenant; rol en app_metadata. ───────────────
interface SeedStaff {
  readonly role: Extract<AppRole, 'admin' | 'operador'>;
  readonly email: string;
  readonly password: string;
}

const STAFF: readonly SeedStaff[] = [
  {
    role: 'admin',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@creatiba.test',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'Password123!',
  },
  {
    role: 'operador',
    email: process.env.SEED_OPERADOR_EMAIL ?? 'operador@creatiba.test',
    password: process.env.SEED_OPERADOR_PASSWORD ?? 'Password123!',
  },
];

// ── Catalogo de agencias Go On (scrapeo de go-on.mx). Sin usuario. ───────────
interface CatalogAgency {
  readonly nombre: string;
  readonly direccion: string;
  readonly marca: string;
}

const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const loadCatalog = (): readonly CatalogAgency[] => {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, 'data', 'go-on-agencies.json'), 'utf8');
  const parsed = JSON.parse(raw) as { agencies: CatalogAgency[] };
  return parsed.agencies;
};

const seedCatalog = async (): Promise<void> => {
  const catalog = loadCatalog();
  for (const c of catalog) {
    const { error } = await admin
      .from('agencies')
      .upsert({ name: c.nombre, slug: slugify(c.nombre), address: c.direccion }, { onConflict: 'slug' });
    if (error) throw new Error(`catalogo agencia (${c.nombre}): ${error.message}`);
  }
  console.log(`Catalogo Go On sembrado (${catalog.length} agencias disponibles).`);
};

const main = async (): Promise<void> => {
  assertServiceRole(serviceRole);

  // 1) Staff
  for (const s of STAFF) {
    await upsertUserWithRole(s.email, s.password, s.role, null);
  }

  // 2) Catalogo de 27 agencias (sin usuario, disponibles para /registro)
  await seedCatalog();

  // 3) Agencias demo con brand_profile + usuario solicitante (1:1)
  for (const a of AGENCIES) {
    const tenantId = await upsertAgency(a);
    await upsertBrandProfile(tenantId, a);
    const userId = await upsertUserWithRole(a.userEmail, a.userPassword, 'solicitante', tenantId);
    await linkAgencyUser(tenantId, userId);
    console.log(`OK ${a.name} -> ${tenantId}`);
  }

  console.log('Seed completado.');
};

// process.exitCode (no process.exit) para no cortar el event loop mientras el
// cliente de Supabase aun cierra conexiones (evita el assert de libuv en Windows).
main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  if (message.includes('permission denied')) {
    console.error(
      'Pista: "permission denied" = el rol conectado no tiene privilegios sobre la tabla. ' +
        'Verifica que la llave sea service_role y aplica supabase/migrations/0002_grants.sql.',
    );
  }
  process.exitCode = 1;
});
