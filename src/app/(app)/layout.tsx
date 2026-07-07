import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { AppShell } from '@/components/shell/app-shell';

/** Layout protegido: todas las secciones requieren sesion. Rol y tenant del JWT. */
export default async function AppLayout({ children }: { readonly children: React.ReactNode }) {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);

  return (
    <AppShell
      user={{
        email: session.value.email,
        role: session.value.role,
        tenantId: session.value.tenantId,
      }}
    >
      {children}
    </AppShell>
  );
}
