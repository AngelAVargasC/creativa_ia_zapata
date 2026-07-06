import type { NextRequest } from 'next/server';
import { updateSession } from '@/db/supabase-middleware';

/** En cada request refrescamos la sesion de servidor (cookies de Supabase). */
export const middleware = (request: NextRequest) => updateSession(request);

export const config = {
  // Todo menos assets estaticos. Incluye paginas y rutas /api.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
