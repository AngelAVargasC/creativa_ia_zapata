import type { Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { getSolicitud, listEventos } from '@/modules/solicitudes/repository';
import { STATUS_ORDER, STATUS_META, fieldLabel } from '@/modules/solicitudes/labels';
import { formatDateTime } from '@/modules/solicitudes/format';
import type { SolicitudEvento, SolicitudWithAgency } from '@/modules/solicitudes/types';
import { PageHeader } from '@/components/shell/page-header';
import { FadeIn } from '@/components/shell/fade-in';
import { StatusBadge } from '@/components/solicitudes/status-badge';
import { updateSolicitudAction, deleteSolicitudAction } from '../actions';
import styles from '../solicitudes.module.css';
import shell from '@/components/shell/shell.module.css';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  solicitante: 'Agencia',
};

const pautaLabel = (v: string | null): string => (v === 'pauta' ? 'Pauta' : v === 'feed' ? 'Feed' : '—');

/** Texto legible de un valor de campo en la bitacora (status/pauta a etiqueta). */
const displayValue = (field: string | null, value: string | null): string => {
  if (!value) return '—';
  if (field === 'status') return STATUS_META[value as keyof typeof STATUS_META]?.label ?? value;
  if (field === 'pauta_o_feed') return pautaLabel(value);
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

  const canEditOwn = !staff && s.status === 'nueva';
  const target = `/solicitudes/${id}` as Route;

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title={s.tipo_contenido}
          description={`${s.agencia_nombre} · ${pautaLabel(s.pauta_o_feed)}`}
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
          {/* ── Columna principal: datos + edicion ── */}
          <FadeIn delay={0.04}>
            <section className={`card ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Detalle</h2>

              {staff ? (
                <StaffForm solicitud={s} target={target} />
              ) : canEditOwn ? (
                <SolicitanteForm solicitud={s} target={target} />
              ) : (
                <ReadOnlyView solicitud={s} />
              )}

              {!staff && !canEditOwn && (
                <p className="hint">
                  Esta solicitud ya está en proceso; para cambios contacta al equipo. Solo puedes editar mientras
                  está «Nueva».
                </p>
              )}
            </section>
          </FadeIn>

          {/* ── Columna lateral: bitacora ── */}
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

/* ── Vista de solo lectura (agencia con solicitud ya en proceso) ── */
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
        <dt>Segmentación geográfica</dt>
        <dd>{s.segmentacion_geografica || '—'}</dd>
      </div>
      <div>
        <dt>Link final</dt>
        <dd>
          {s.link_final ? (
            <a href={s.link_final} target="_blank" rel="noreferrer noopener">
              {s.link_final}
            </a>
          ) : (
            '—'
          )}
        </dd>
      </div>
    </dl>
  );
}

/* ── Formulario del solicitante (solo sus campos, solo si 'nueva') ── */
function SolicitanteForm({
  solicitud: s,
  target,
}: {
  readonly solicitud: SolicitudWithAgency;
  readonly target: string;
}) {
  return (
    <form action={updateSolicitudAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <input type="hidden" name="id" value={s.id} />
      <div className={styles.row}>
        <label className="field">
          <span className="field-label">Tipo de contenido</span>
          <input className="input" name="tipo_contenido" defaultValue={s.tipo_contenido} required />
        </label>
        <label className="field">
          <span className="field-label">¿Pauta o feed?</span>
          <select className="select" name="pauta_o_feed" defaultValue={s.pauta_o_feed ?? ''}>
            <option value="">Sin especificar</option>
            <option value="feed">Feed</option>
            <option value="pauta">Pauta</option>
          </select>
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
      <div className={styles.actions}>
        <DeleteButton id={s.id} target={target} />
        <button className="btn btn-primary" type="submit">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

/* ── Formulario de staff (status + link_final + datos) ── */
function StaffForm({
  solicitud: s,
  target,
}: {
  readonly solicitud: SolicitudWithAgency;
  readonly target: string;
}) {
  return (
    <form action={updateSolicitudAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <input type="hidden" name="id" value={s.id} />
      <div className={styles.row}>
        <label className="field">
          <span className="field-label">Estatus</span>
          <select className="select" name="status" defaultValue={s.status}>
            {STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {STATUS_META[st].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">¿Pauta o feed?</span>
          <select className="select" name="pauta_o_feed" defaultValue={s.pauta_o_feed ?? ''}>
            <option value="">Sin especificar</option>
            <option value="feed">Feed</option>
            <option value="pauta">Pauta</option>
          </select>
        </label>
      </div>

      <label className="field">
        <span className="field-label">Link final</span>
        <input
          className="input"
          name="link_final"
          type="url"
          defaultValue={s.link_final}
          placeholder="https://… (posteo listo para publicar)"
        />
      </label>

      <label className="field">
        <span className="field-label">Tipo de contenido</span>
        <input className="input" name="tipo_contenido" defaultValue={s.tipo_contenido} required />
      </label>
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

      <div className={styles.actions}>
        <DeleteButton id={s.id} target={target} />
        <button className="btn btn-primary" type="submit">
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

/* ── Boton de eliminar: reenvia el mismo form (con el id oculto) a la accion de borrado ── */
function DeleteButton({ id: _id }: { readonly id: string; readonly target: string }) {
  return (
    <button className="btn btn-ghost" type="submit" formAction={deleteSolicitudAction}>
      Eliminar
    </button>
  );
}
