import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';

/** Raiz: al inicio (home) si hay sesion, o al login si no. */
export default async function RootPage() {
  const session = await resolveSession();
  redirect((session.ok ? '/inicio' : '/login') as Route);
}
