import { listOperadores } from '@/modules/operadores/service';
import { formatDate } from '@/modules/solicitudes/format';
import { PageHeader } from '@/components/shell/page-header';
import { EmptyState } from '@/components/shell/empty-state';
import { FadeIn } from '@/components/shell/fade-in';
import { UsersIcon } from '@/components/shell/icons';
import { createOperadorAction, toggleOperadorAction, deleteOperadorAction } from './actions';
import styles from '../../solicitudes/solicitudes.module.css';
import shell from '@/components/shell/shell.module.css';

const NOTICES: Record<string, { tone: 'ok' | 'err'; text: string }> = {
  created: { tone: 'ok', text: 'Operador creado. Comparte la contraseña temporal de forma segura.' },
  deleted: { tone: 'ok', text: 'Operador eliminado.' },
  invalid: { tone: 'err', text: 'Revisa el email y la contraseña (mínimo 8 caracteres).' },
  save: { tone: 'err', text: 'No se pudo completar la operación.' },
  rate: { tone: 'err', text: 'Demasiados intentos. Espera unos minutos.' },
};

export default async function OperadoresPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  const notice = ok ? NOTICES[ok] : error ? NOTICES[error] : null;

  const res = await listOperadores();
  const operadores = res.ok ? res.value : [];

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Operadores"
          description="Da de alta y administra a las cuentas del equipo que gestionan las solicitudes."
        />
      </FadeIn>

      <div className={shell.pageBody}>
        {notice && (
          <FadeIn>
            <p
              className={`${styles.notice} ${notice.tone === 'ok' ? styles.noticeOk : styles.noticeError}`}
              role={notice.tone === 'ok' ? 'status' : 'alert'}
            >
              {notice.text}
            </p>
          </FadeIn>
        )}

        {/* Alta de operador */}
        <FadeIn delay={0.04}>
          <form action={createOperadorAction} className={`card ${styles.formCard}`}>
            <h2 className={styles.panelTitle}>Nuevo operador</h2>
            <div className={styles.row}>
              <label className="field">
                <span className="field-label">Email</span>
                <input className="input" name="email" type="email" autoComplete="off" required />
              </label>
              <label className="field">
                <span className="field-label">Contraseña temporal</span>
                <input className="input" name="password" type="text" minLength={8} required />
                <span className="hint">Mínimo 8 caracteres. El operador podrá cambiarla después.</span>
              </label>
            </div>
            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                Crear operador
              </button>
            </div>
          </form>
        </FadeIn>

        {/* Listado */}
        <div style={{ marginTop: 'var(--space-5)' }}>
          {operadores.length === 0 ? (
            <FadeIn delay={0.08}>
              <EmptyState
                icon={<UsersIcon size={22} />}
                title="Aún no hay operadores"
                description="Crea la primera cuenta de operador para que empiece a gestionar solicitudes."
              />
            </FadeIn>
          ) : (
            <FadeIn delay={0.06}>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Estado</th>
                      <th>Alta</th>
                      <th>Último acceso</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operadores.map((o) => (
                      <tr key={o.id}>
                        <td>{o.email}</td>
                        <td>
                          <span className="badge" data-tone={o.active ? 'ok' : 'muted'}>
                            {o.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>{formatDate(o.createdAt)}</td>
                        <td>{o.lastSignInAt ? formatDate(o.lastSignInAt) : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <form action={toggleOperadorAction}>
                              <input type="hidden" name="id" value={o.id} />
                              <input type="hidden" name="active" value={o.active ? 'false' : 'true'} />
                              <button className="btn btn-ghost" type="submit">
                                {o.active ? 'Desactivar' : 'Activar'}
                              </button>
                            </form>
                            <form action={deleteOperadorAction}>
                              <input type="hidden" name="id" value={o.id} />
                              <button className="btn btn-ghost" type="submit">
                                Eliminar
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </>
  );
}
