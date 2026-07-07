import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';

/** Toda la seccion /admin exige rol admin. Doble defensa: aqui y en cada action. */
export default async function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  if (session.value.role !== 'admin') redirect('/solicitudes' as Route);
  return <>{children}</>;
}
