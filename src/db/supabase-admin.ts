import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadServerEnv } from '@/config/env';
import { AppError } from '@/core/errors';

/**
 * Cliente Supabase con SERVICE ROLE. Ignora RLS y tiene privilegios totales.
 *
 * USO EXCLUSIVO en el servidor para operaciones administrativas controladas que
 * no pueden pasar por RLS: registro de agencias (crear agencia + usuario) y CRUD
 * de operadores (crea usuarios en auth.users). NUNCA se expone al cliente.
 *
 * REGLA: toda llamada que use este cliente DEBE ir precedida de una verificacion
 * de identidad/rol en el servidor (p.ej. exigir role='admin'). El cliente por si
 * mismo no autoriza nada: solo evita RLS.
 */
export const getSupabaseAdminClient = (): SupabaseClient => {
  const env = loadServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError('PROVIDER_UNAVAILABLE', 'Supabase service role no configurado');
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
