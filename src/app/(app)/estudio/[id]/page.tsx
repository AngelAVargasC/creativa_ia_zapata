import type { Route } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { getPost } from '@/modules/posts/repository';
import type { Design } from '@/modules/post-editor/types';
import { PageHeader } from '@/components/shell/page-header';
import { ArrowLeftIcon } from '@/components/shell/icons';
import { FadeIn } from '@/components/shell/fade-in';
import { PostEditor } from '@/components/post-editor/post-editor';
import shell from '@/components/shell/shell.module.css';

/** Editar un post guardado. Carga su diseño y lo abre en el editor. */
export default async function EstudioEditarPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  if (!isStaffRole(session.value.role)) redirect('/solicitudes' as Route);

  const { id } = await params;
  const res = await getPost(id);
  if (!res.ok) notFound();
  const p = res.value;

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Estudio de post"
          description={`Editando: ${p.title}`}
          actions={
            <Link className="btn btn-ghost" href={'/biblioteca' as Route}>
              <ArrowLeftIcon size={16} />
              Volver a la biblioteca
            </Link>
          }
        />
      </FadeIn>
      <div className={shell.pageBody}>
        <FadeIn delay={0.06}>
          <PostEditor
            info=""
            seedModelo=""
            postId={p.id}
            initialDesign={p.design as Design}
            initialTitle={p.title}
            initialCaption={p.caption}
            solicitudId={p.solicitud_id ?? undefined}
            tenantId={p.tenant_id}
          />
        </FadeIn>
      </div>
    </>
  );
}
