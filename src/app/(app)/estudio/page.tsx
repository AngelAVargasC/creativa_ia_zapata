import type { Route } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { PageHeader } from '@/components/shell/page-header';
import { FadeIn } from '@/components/shell/fade-in';
import { PostEditor } from '@/components/post-editor/post-editor';
import shell from '@/components/shell/shell.module.css';

/** Estudio desde cero: crea un post sin solicitud asociada. Solo staff. */
export default async function EstudioNuevoPage() {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  if (!isStaffRole(session.value.role)) redirect('/solicitudes' as Route);

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Estudio de post"
          description="Crea un post desde cero. Guárdalo para seguir trabajándolo o publicarlo después."
          actions={
            <Link className="btn btn-ghost" href={'/biblioteca' as Route}>
              Ver biblioteca
            </Link>
          }
        />
      </FadeIn>
      <div className={shell.pageBody}>
        <FadeIn delay={0.06}>
          <PostEditor info="" seedModelo="" />
        </FadeIn>
      </div>
    </>
  );
}
