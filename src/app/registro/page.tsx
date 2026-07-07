import Link from 'next/link';
import type { Route } from 'next';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LogoMark } from '@/components/shell/icons';
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
      <aside className={styles.brand}>
        <span className={styles.grain} aria-hidden="true" />
        <div className={styles.brandInner}>
          <div className={styles.brandLogo}>
            <LogoMark size={26} />
            Creatiba
          </div>
          <div>
            <h1 className={styles.headline}>
              Crea tu cuenta
              <br />
              de agencia.
            </h1>
            <p className={styles.brandSub}>
              Registra tu agencia para enviar solicitudes de contenido, pauta y feed, y seguir su estatus hasta el
              link final.
            </p>
          </div>
          <p className={styles.brandFoot}>GRUPO ZAPATA · PLATAFORMA CREATIVA IA</p>
        </div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.formTop}>
          <ThemeToggle />
        </div>
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
      </main>
    </div>
  );
}
