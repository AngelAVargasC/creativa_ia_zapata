import type { Route } from 'next';
import { redirect } from 'next/navigation';
import { resolveSession } from '@/core/auth/resolve-session';
import { isStaffRole } from '@/core/tenant';
import { getSupabaseServerClient } from '@/db/supabase-server';
import { PageHeader } from '@/components/shell/page-header';
import { FadeIn } from '@/components/shell/fade-in';
import { createSolicitudAction } from '../actions';
import styles from '../solicitudes.module.css';
import shell from '@/components/shell/shell.module.css';

const ERRORS: Record<string, string> = {
  invalid: 'Revisa los campos: el tipo de contenido es obligatorio.',
  agencia: 'Selecciona la agencia para la que creas la solicitud.',
  save: 'No se pudo guardar la solicitud. Intenta de nuevo.',
};

export default async function NuevaSolicitudPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  const session = await resolveSession();
  if (!session.ok) redirect('/login' as Route);
  const staff = isStaffRole(session.value.role);

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? 'No se pudo crear la solicitud.') : null;

  let agencies: { id: string; name: string }[] = [];
  if (staff) {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.from('agencies').select('id, name').order('name');
    agencies = (data ?? []) as { id: string; name: string }[];
  }

  return (
    <>
      <FadeIn y={6}>
        <PageHeader
          title="Nueva solicitud"
          description="Describe la pieza que necesitas. El equipo la tomará y actualizará su estatus."
        />
      </FadeIn>

      <div className={shell.pageBody}>
        <FadeIn delay={0.06}>
          <form action={createSolicitudAction} className={`card ${styles.formCard}`}>
            {message && (
              <p role="alert" className={`${styles.notice} ${styles.noticeError}`}>
                {message}
              </p>
            )}

            {staff && (
              <label className="field">
                <span className="field-label">Agencia</span>
                <select className="select" name="tenant_id" defaultValue="" required>
                  <option value="" disabled>
                    Selecciona la agencia…
                  </option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className={styles.row}>
              <label className="field">
                <span className="field-label">Tipo de contenido</span>
                <input
                  className="input"
                  name="tipo_contenido"
                  placeholder="Posteo de feed, edición de microperforados…"
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">¿Pauta o feed?</span>
                <select className="select" name="pauta_o_feed" defaultValue="">
                  <option value="">Sin especificar</option>
                  <option value="feed">Feed</option>
                  <option value="pauta">Pauta</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span className="field-label">Descripción</span>
              <textarea
                className="textarea"
                name="descripcion"
                placeholder="Posteo con foto de promoción, cambio de unidades del centro…"
              />
            </label>

            <label className="field">
              <span className="field-label">Información</span>
              <textarea
                className="textarea"
                name="informacion"
                placeholder="Datos de la promo, unidad, versión que debe coincidir con el frente real…"
              />
            </label>

            <div className={styles.row}>
              <label className="field">
                <span className="field-label">Insumos</span>
                <textarea
                  className="textarea"
                  name="insumos"
                  placeholder="Links a las fotos/PDF (Drive, WhatsApp)…"
                  style={{ minHeight: 64 }}
                />
              </label>
              <label className="field">
                <span className="field-label">Segmentación geográfica</span>
                <textarea
                  className="textarea"
                  name="segmentacion_geografica"
                  placeholder="Zona / ciudad objetivo (si aplica)…"
                  style={{ minHeight: 64 }}
                />
              </label>
            </div>

            <div className={styles.actions}>
              <button className="btn btn-primary" type="submit">
                Crear solicitud
              </button>
            </div>
          </form>
        </FadeIn>
      </div>
    </>
  );
}
