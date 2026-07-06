import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveTenant } from '@/core/auth/resolve-tenant';
import { AppShell } from '@/components/shell/app-shell';

/** Layout protegido: todas las secciones requieren sesion. Tenant del JWT. */
export default async function AppLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await resolveTenant();
  if (!session.ok) redirect('/login' as Route);

  return (
    <AppShell user={{ email: session.value.email, tenantId: session.value.tenantId }}>{children}</AppShell>
  );
}
