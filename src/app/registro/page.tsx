import Link from 'next/link';
import type { Route } from 'next';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { listAvailableAgencies, type AvailableAgency } from '@/modules/registro/service';
import { RegistroClient } from './registro-client';
import styles from '@/app/login/login.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Revisa los datos del formulario.',
  taken: 'Esa agencia ya tiene una cuenta. Contacta al operador.',
  save: 'No se pudo completar el registro. Intenta de nuevo.',
  rate: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
};

export default async function RegistroPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERROR_MESSAGES[error] ?? 'No se pudo registrar.') : null;

  let agencies: AvailableAgency[] = [];
  let catalogError = false;
  try {
    agencies = await listAvailableAgencies();
  } catch {
    catalogError = true;
  }

  return (
    <div className={styles.split}>
      {/* Fondo inmersivo continuo a pantalla completa (sin divisor) */}
      <div className={styles.aurora} aria-hidden="true">
        <span className={styles.orb1} />
        <span className={styles.orb2} />
        <span className={styles.orb3} />
        <span className={styles.orb4} />
        <span className={styles.orb5} />
      </div>
      <span className={styles.grid} aria-hidden="true" />
      <span className={styles.grain} aria-hidden="true" />

      <div className={styles.themeToggleFloat}>
        <ThemeToggle />
      </div>

      <aside className={styles.brand}>
        <div className={styles.brandInner}>
          <div className={styles.lockup}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/logo_creatiba.png" alt="Creatiba" className={styles.logoCreatiba} />
            <span className={styles.lockupX} aria-hidden="true">
              ×
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/logo-zapata-white.png" alt="Grupo Zapata" className={styles.logoZapata} />
          </div>

          <div>
            <p className={styles.eyebrow}>Registro · Agencias del Grupo</p>
            <h1 className={styles.headline}>
              Crea tu cuenta
              <br />
              de <span className={styles.headlineAccent}>agencia</span>.
            </h1>
            <p className={styles.brandSub}>
              Registra tu agencia para enviar solicitudes de contenido, pauta y feed, y seguir su estatus hasta el
              link final.
            </p>
          </div>

          <p className={styles.brandFoot}>
            <span className={styles.footDot} aria-hidden="true" />
            Una alianza Creatiba × Grupo Zapata
          </p>
        </div>
      </aside>

      <main className={styles.formSide}>
        <span className={styles.formGlow} aria-hidden="true" />
        <div className={styles.card}>
          <span className={styles.cardSheen} aria-hidden="true" />
          <div className={styles.formInner}>
            <h2 className={styles.formTitle}>Registro de agencia</h2>
            <p className={styles.formSub}>
              ¿Ya tienes cuenta?{' '}
              <Link href={'/login' as Route} className={styles.link}>
                Inicia sesión
              </Link>
            </p>

            {message && (
              <p role="alert" className={styles.error}>
                {message}
              </p>
            )}

            <RegistroClient agencies={agencies} catalogError={catalogError} />
          </div>
        </div>
      </main>
    </div>
  );
}
