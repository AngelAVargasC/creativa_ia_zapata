import Link from 'next/link';
import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { getSolicitud, listEventos } from '@/modules/solicitudes/repository';
import { fieldLabel, statusLabel, TIPO_CONTENIDO_SUGERENCIAS, FORMATO_SUGERENCIAS } from '@/modules/solicitudes/labels';
import { formatDateTime } from '@/modules/solicitudes/format';
import type { SolicitudEvento, SolicitudWithAgency } from '@/modules/solicitudes/types';
import { PageHeader } from '@/components/shell/page-header';
import { SparklesIcon } from '@/components/shell/icons';
import { FadeIn } from '@/components/shell/fade-in';
import { StatusBadge } from '@/components/solicitudes/status-badge';
import { StatusControl } from './status-control';
import { updateSolicitudAction, deleteSolicitudAction } from '../actions';
import styles from '../solicitudes.module.css';
import shell from '@/components/shell/shell.module.css';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  solicitante: 'Agencia',
};

const displayValue = (field: string | null, value: string | null): string => {
  if (!value) return '—';
  if (field === 'status') return statusLabel(value).label;
  if (field === 'pautado') return value === 'true' ? 'Sí' : 'No';
  return value;
};

const eventText = (e: SolicitudEvento): string => {
  const who = ROLE_LABEL[e.changed_role ?? ''] ?? 'Alguien';
  if (e.action === 'insert') return `${who} creó la solicitud`;
  return `${who} actualizó «${fieldLabel(e.field)}»`;
};

export default async function SolicitudDetailPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ id: string }>;
  readonly searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  const staff = isStaffRole(session.value.role);

  const { id } = await params;
  const { ok, error } = await searchParams;

  const res = await getSolicitud(id);
  if (!res.ok) notFound();
  const s = res.value;

  const eventosRes = await listEventos(id);
  const eventos = eventosRes.ok ? eventosRes.value : [];

  const canEditData = staff || s.status === 'nueva';

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title={s.tipo_contenido}
          description={`${s.agencia_nombre}${s.formato ? ` · ${s.formato}` : ''}`}
          actions={<StatusBadge status={s.status} />}
        />
      </FadeIn>

      <div className={shell.pageBody}>
        {ok && (
          <FadeIn>
            <p className={`${styles.notice} ${styles.noticeOk}`} role="status">
              Cambios guardados.
            </p>
          </FadeIn>
        )}
        {error && (
          <FadeIn>
            <p className={`${styles.notice} ${styles.noticeError}`} role="alert">
              {error === 'forbidden'
                ? 'No tienes permiso para ese cambio (o la solicitud ya no está editable).'
                : 'Revisa los campos e intenta de nuevo.'}
            </p>
          </FadeIn>
        )}

        <div className={styles.detailGrid}>
          {/* ── Columna principal ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Gestión del operador: estatus + link, arriba y visible */}
            {staff && (
              <FadeIn delay={0.03}>
                <section className={`card ${styles.gestionCard}`}>
                  <div className={styles.gestionHead}>
                    <span className={styles.sectionLabel}>Gestión</span>
                    <Link className="btn btn-primary" href={`/solicitudes/${s.id}/post` as Route}>
                      <SparklesIcon size={16} />
                      Generar post
                    </Link>
                  </div>
                  <StatusControl id={s.id} status={s.status} linkFinal={s.link_final} />
                </section>
              </FadeIn>
            )}

            {/* Estatus visible para la agencia (solo lectura) */}
            {!staff && (
              <FadeIn delay={0.03}>
                <section className={`card ${styles.gestionCard}`}>
                  <span className={styles.sectionLabel}>Estatus de tu solicitud</span>
                  <div className={styles.metaRow}>
                    <StatusBadge status={s.status} />
                    {s.link_final ? (
                      <a href={s.link_final} target="_blank" rel="noreferrer noopener">
                        Ver posteo final
                      </a>
                    ) : (
                      <span className="hint">Aún sin link final.</span>
                    )}
                  </div>
                </section>
              </FadeIn>
            )}

            {/* Datos de la solicitud */}
            <FadeIn delay={0.06}>
              <section className={`card ${styles.panel}`}>
                <h2 className={styles.panelTitle}>Datos de la solicitud</h2>
                {canEditData ? (
                  <DataForm solicitud={s} staff={staff} />
                ) : (
                  <>
                    <ReadOnlyView solicitud={s} />
                    <p className="hint">
                      Esta solicitud ya está en proceso; solo puedes editarla mientras está «Nueva». Para cambios,
                      contacta al equipo.
                    </p>
                  </>
                )}
              </section>
            </FadeIn>
          </div>

          {/* ── Bitácora ── */}
          <FadeIn delay={0.1}>
            <section className={`card ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Historial de cambios</h2>
              <div className={styles.timeline}>
                {eventos.length === 0 && <p className="hint">Sin cambios registrados.</p>}
                {eventos.map((e) => (
                  <div key={e.id} className={styles.event}>
                    <div className={styles.eventHead}>{eventText(e)}</div>
                    <div className={styles.eventMeta}>{formatDateTime(e.created_at)}</div>
                    {e.action === 'update' && (
                      <div className={styles.eventDiff}>
                        <span className="old">{displayValue(e.field, e.old_value)}</span>
                        {' → '}
                        <span>{displayValue(e.field, e.new_value)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </FadeIn>
        </div>
      </div>
    </>
  );
}

/* ── Vista de solo lectura ── */
function ReadOnlyView({ solicitud: s }: { readonly solicitud: SolicitudWithAgency }) {
  return (
    <dl className={styles.dl}>
      <div>
        <dt>Descripción</dt>
        <dd>{s.descripcion || '—'}</dd>
      </div>
      <div>
        <dt>Información</dt>
        <dd>{s.informacion || '—'}</dd>
      </div>
      <div>
        <dt>Insumos</dt>
        <dd>{s.insumos || '—'}</dd>
      </div>
      <div>
        <dt>Formato</dt>
        <dd>{s.formato || '—'}</dd>
      </div>
      <div>
        <dt>Segmentación geográfica</dt>
        <dd>{s.segmentacion_geografica || '—'}</dd>
      </div>
      {s.copy_out && (
        <div>
          <dt>Copy final</dt>
          <dd>{s.copy_out}</dd>
        </div>
      )}
    </dl>
  );
}

/* ── Formulario de datos (agencia mientras «nueva», o correcciones del staff) ── */
function DataForm({ solicitud: s, staff }: { readonly solicitud: SolicitudWithAgency; readonly staff: boolean }) {
  return (
    <form action={updateSolicitudAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <input type="hidden" name="id" value={s.id} />
      <div className={styles.row}>
        <label className="field">
          <span className="field-label">Tipo de contenido</span>
          <input className="input" name="tipo_contenido" list="tipos-det" defaultValue={s.tipo_contenido} required />
          <datalist id="tipos-det">
            {TIPO_CONTENIDO_SUGERENCIAS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span className="field-label">Formato</span>
          <input className="input" name="formato" list="formatos-det" defaultValue={s.formato} placeholder="Feed, Pauta, Story…" />
          <datalist id="formatos-det">
            {FORMATO_SUGERENCIAS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </label>
      </div>
      <label className="field">
        <span className="field-label">Descripción</span>
        <textarea className="textarea" name="descripcion" defaultValue={s.descripcion} />
      </label>
      <label className="field">
        <span className="field-label">Información</span>
        <textarea className="textarea" name="informacion" defaultValue={s.informacion} />
      </label>
      <label className="field">
        <span className="field-label">Insumos</span>
        <textarea className="textarea" name="insumos" defaultValue={s.insumos} style={{ minHeight: 64 }} />
      </label>
      <label className="field">
        <span className="field-label">Segmentación geográfica</span>
        <textarea
          className="textarea"
          name="segmentacion_geografica"
          defaultValue={s.segmentacion_geografica}
          style={{ minHeight: 64 }}
        />
      </label>

      {staff && (
        <>
          <label className="field">
            <span className="field-label">Copy out (copy entregado)</span>
            <textarea className="textarea" name="copy_out" defaultValue={s.copy_out} placeholder="Copy/caption final que se entrega…" />
          </label>
          <label className="field">
            <span className="field-label">Comentarios (internos)</span>
            <textarea className="textarea" name="comentarios" defaultValue={s.comentarios} style={{ minHeight: 64 }} />
          </label>
          <label className="field">
            <span className="field-label">¿Pautado?</span>
            <select className="select" name="pautado" defaultValue={s.pautado ? 'true' : 'false'}>
              <option value="false">No</option>
              <option value="true">Sí, se pautó</option>
            </select>
          </label>
        </>
      )}

      <div className={styles.actions}>
        <button className="btn btn-ghost" type="submit" formAction={deleteSolicitudAction}>
          Eliminar
        </button>
        <button className="btn btn-primary" type="submit">
          {staff ? 'Guardar datos' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
