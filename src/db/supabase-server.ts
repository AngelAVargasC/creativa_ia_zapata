import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { loadServerEnv } from '@/config/env';
import { AppError } from '@/core/errors';

/**
 * Cliente Supabase para el servidor (RSC, route handlers, server actions).
 * Usa la cookie de sesion -> respeta RLS por tenant. NUNCA usa la service role
 * aqui: eso anularia RLS. La service role solo para tareas de backend/jobs.
 */
export const getSupabaseServerClient = async () => {
  const env = loadServerEnv();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new AppError('PROVIDER_UNAVAILABLE', 'Supabase no configurado');
  }

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options }));
        } catch {
          // Llamado desde un Server Component: el refresco de sesion lo hace el middleware.
        }
      },
    },
  });
};
