import Link from 'next/link';
import type { Route } from 'next';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { listSolicitudes } from '@/modules/solicitudes/repository';
import { formatDate } from '@/modules/solicitudes/format';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/shell/empty-state';
import { FadeIn } from '@/components/shell/fade-in';
import { ClipboardIcon, PlusIcon } from '@/components/shell/icons';
import { StatusBadge } from '@/components/solicitudes/status-badge';
import shell from '@/components/shell/shell.module.css';

export default async function SolicitudesPage() {
  const session = await resolveSession();
  const staff = session.ok && isStaffRole(session.value.role);

  const res = await listSolicitudes();
  const rows = res.ok ? res.value : [];

  const nueva = (
    <Link className="btn btn-primary" href={'/solicitudes/nueva' as Route}>
      <PlusIcon /> Nueva solicitud
    </Link>
  );

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title={staff ? 'Solicitudes' : 'Mis solicitudes'}
          description={
            staff
              ? 'Todas las solicitudes de las agencias. Actualiza el estatus y agrega el link final.'
              : 'Tus solicitudes de contenido, pauta y feed. Sigue su estatus hasta el link final.'
          }
          actions={nueva}
        />
      </FadeIn>

      <div className={shell.pageBody}>
        {rows.length === 0 ? (
          <FadeIn delay={0.08}>
            <EmptyState
              icon={<ClipboardIcon size={22} />}
              title="Aún no hay solicitudes"
              description={
                staff
                  ? 'Cuando las agencias envíen solicitudes, aparecerán aquí para gestionarlas.'
                  : 'Crea tu primera solicitud de contenido para que el equipo la trabaje.'
              }
              action={nueva}
            />
          </FadeIn>
        ) : (
          <FadeIn delay={0.06}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {staff && <th>Agencia</th>}
                    <th>Tipo de contenido</th>
                    <th>Pauta / Feed</th>
                    <th>Estatus</th>
                    <th>Actualizada</th>
                    <th>Link final</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      {staff && (
                        <td>
                          <Link href={`/solicitudes/${s.id}` as Route}>{s.agencia_nombre}</Link>
                        </td>
                      )}
                      <td>
                        <Link href={`/solicitudes/${s.id}` as Route}>{s.tipo_contenido}</Link>
                      </td>
                      <td>{s.pauta_o_feed ? (s.pauta_o_feed === 'pauta' ? 'Pauta' : 'Feed') : '—'}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td>{formatDate(s.updated_at)}</td>
                      <td>
                        {s.link_final ? (
                          <a href={s.link_final} target="_blank" rel="noreferrer noopener">
                            Ver
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeIn>
        )}
      </div>
    </>
  );
}
