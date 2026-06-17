import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para el navegador. Solo claves publicas (anon).
 * Toda lectura/escritura queda sujeta a RLS por tenant.
 */
export const getSupabaseBrowserClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase no configurado (NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY)');
  }
  return createBrowserClient(url, anonKey);
};
