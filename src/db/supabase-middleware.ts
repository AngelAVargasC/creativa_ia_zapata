import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

/**
 * Refresca la sesion de Supabase en cada request (lee/escribe las cookies de
 * sesion). Asi `auth.getUser()` en server components, route handlers y server
 * actions ve siempre una sesion valida.
 *
 * El tenant se deriva SIEMPRE del JWT en el servidor (ver `resolveTenant`),
 * nunca del cliente. Si Supabase no esta configurado, deja pasar sin sesion.
 *
 * Lee `process.env` directamente (no `loadServerEnv`) para no arrastrar
 * `server-only` al runtime de middleware (edge).
 */
export const updateSession = async (request: NextRequest): Promise<NextResponse> => {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options }),
        );
      },
    },
  });

  // Revalida y refresca el token. IMPORTANTE: no usar getSession() en servidor.
  await supabase.auth.getUser();

  return response;
};
