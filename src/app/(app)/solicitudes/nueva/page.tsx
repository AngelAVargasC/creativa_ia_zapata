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
              <p role="alert" className={`${styles.notice} ${styles.noticeError} ${styles.full}`}>
                {message}
              </p>
            )}

            {staff && (
              <label className={`field ${styles.full}`}>
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

            <label className="field">
              <span className="field-label">Tipo de contenido</span>
              <input
                className="input"
                name="tipo_contenido"
                list="tipos-contenido"
                placeholder="Posteo de feed"
                required
              />
              <datalist id="tipos-contenido">
                <option value="Posteo de feed" />
                <option value="Story" />
                <option value="Reel" />
                <option value="Edición de microperforados" />
                <option value="Diseño para impresión" />
              </datalist>
              <span className="hint">Qué pieza necesitas. Elige una sugerencia o escribe la tuya.</span>
            </label>

            <label className="field">
              <span className="field-label">¿Pauta o feed?</span>
              <select className="select" name="pauta_o_feed" defaultValue="">
                <option value="">Sin especificar</option>
                <option value="feed">Feed (publicación orgánica)</option>
                <option value="pauta">Pauta (anuncio pagado)</option>
              </select>
              <span className="hint">Feed = va al perfil. Pauta = campaña pagada.</span>
            </label>

            <label className="field">
              <span className="field-label">Descripción</span>
              <input className="input" name="descripcion" placeholder="Ej: Posteo con foto de promoción" />
              <span className="hint">En una frase: qué se necesita.</span>
            </label>

            <label className="field">
              <span className="field-label">Segmentación geográfica</span>
              <input className="input" name="segmentacion_geografica" placeholder="Ej: Pachuca" />
              <span className="hint">Zona o ciudad objetivo, si el anuncio va segmentado (opcional).</span>
            </label>

            <label className={`field ${styles.full}`}>
              <span className="field-label">Información</span>
              <textarea
                className="textarea"
                name="informacion"
                placeholder={
                  'Todos los datos de la pieza. Ej:\nNAVIGATOR RESERVE 4X4 3.5L · Negro · KM 28,000 · $1,568,000\nVersión que debe coincidir con el frente real de la unidad.'
                }
              />
              <span className="hint">
                Mientras más completo, mejor: modelo, versión, color, KM, precio y cualquier detalle especial.
              </span>
            </label>

            <label className={`field ${styles.full}`}>
              <span className="field-label">Insumos</span>
              <textarea
                className="textarea"
                name="insumos"
                placeholder={'Pega los links a fotos/PDF. Ej:\nhttps://drive.google.com/…  ·  Fotos en WhatsApp de Zona Metro 2'}
                style={{ minHeight: 72 }}
              />
              <span className="hint">Links a las fotos o archivos (Drive, WhatsApp, MercadoLibre…).</span>
            </label>

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
