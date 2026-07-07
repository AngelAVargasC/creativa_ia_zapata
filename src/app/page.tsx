import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';

/** Raiz: al espacio de solicitudes si hay sesion, o al login si no. */
export default async function RootPage() {
  const session = await resolveSession();
  redirect((session.ok ? '/solicitudes' : '/login') as Route);
}
