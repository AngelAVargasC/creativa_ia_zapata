import Link from 'next/link';
import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { listPosts } from '@/modules/posts/repository';
import { formatDateTime } from '@/modules/solicitudes/format';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/shell/empty-state';
import { FadeIn } from '@/components/shell/fade-in';
import { LibraryIcon, ImageIcon, PlusIcon } from '@/components/shell/icons';
import { deletePostAction } from '@/app/(app)/estudio/actions';
import shell from '@/components/shell/shell.module.css';

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  borrador: { label: 'Borrador', tone: 'neutral' },
  listo: { label: 'Listo', tone: 'ok' },
  publicado: { label: 'Publicado', tone: 'info' },
};

export default async function BibliotecaPage() {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  if (!isStaffRole(session.value.role)) redirect('/solicitudes' as Route);

  const res = await listPosts();
  const posts = res.ok ? res.value : [];

  const nuevo = (
    <Link className="btn btn-primary" href={'/estudio' as Route}>
      <PlusIcon /> Nuevo post
    </Link>
  );

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Biblioteca de posts"
          description="Todos los posts que has creado en el estudio. Vuelve a abrirlos para editarlos o descargarlos."
          actions={nuevo}
        />
      </FadeIn>

      <div className={shell.pageBody}>
        {posts.length === 0 ? (
          <FadeIn delay={0.08}>
            <EmptyState
              icon={<LibraryIcon size={22} />}
              title="Aún no hay posts guardados"
              description="Crea un post en el estudio y guárdalo; aparecerá aquí con su fecha para seguir trabajándolo."
              action={
                <Link className="btn btn-primary" href={'/estudio' as Route}>
                  <ImageIcon size={16} /> Abrir estudio
                </Link>
              }
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0.06}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Agencia</th>
                    <th>Estado</th>
                    <th>Última edición</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => {
                    const st = STATUS_LABEL[p.status] ?? { label: p.status, tone: 'neutral' };
                    return (
                      <tr key={p.id}>
                        <td>
                          <Link className="cell-title" href={`/estudio/${p.id}` as Route}>
                            {p.title}
                          </Link>
                        </td>
                        <td>
                          {p.agencia_nombre ? <span className="cell-chip">{p.agencia_nombre}</span> : '—'}
                        </td>
                        <td>
                          <span className="badge" data-tone={st.tone}>
                            {st.label}
                          </span>
                        </td>
                        <td className="cell-muted">{formatDateTime(p.updated_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <Link className="btn btn-ghost" href={`/estudio/${p.id}` as Route}>
                              Editar
                            </Link>
                            <form action={deletePostAction}>
                              <input type="hidden" name="id" value={p.id} />
                              <button className="btn btn-ghost" type="submit">
                                Eliminar
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </FadeIn>
        )}
      </div>
    </>
  );
}
