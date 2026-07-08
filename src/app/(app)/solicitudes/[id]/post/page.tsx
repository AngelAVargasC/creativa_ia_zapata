import Link from 'next/link';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { getSolicitud } from '@/modules/solicitudes/repository';
import { PageHeader } from '@/components/shell/page-header';
import { ArrowLeftIcon } from '@/components/shell/icons';
import { FadeIn } from '@/components/shell/fade-in';
import { PostEditor } from '@/components/post-editor/post-editor';
import shell from '@/components/shell/shell.module.css';

export default async function PostStudioPage({ params }: { readonly params: Promise<{ id: string }> }) {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);

  const { id } = await params;
  const res = await getSolicitud(id);
  if (!res.ok) notFound();
  const s = res.value;

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Estudio de post"
          description={`${s.agencia_nombre} · ${s.tipo_contenido}`}
          actions={
            <Link className="btn btn-ghost" href={`/solicitudes/${id}` as Route}>
              <ArrowLeftIcon size={16} />
              Volver a la solicitud
            </Link>
          }
        />
      </FadeIn>

      <div className={shell.pageBody}>
        <FadeIn delay={0.06}>
          <PostEditor solicitudId={s.id} tenantId={s.tenant_id} info={s.informacion} seedModelo="" />
        </FadeIn>
      </div>
    </>
  );
}
