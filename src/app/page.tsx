import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/core/auth/resolve-tenant';

/** Raiz: lleva al espacio de trabajo si hay sesion, o al login si no. */
export default async function RootPage() {
  const session = await resolveTenant();
  redirect((session.ok ? '/generar' : '/login') as Route);
}
