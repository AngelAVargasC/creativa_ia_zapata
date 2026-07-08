import Link from 'next/link';
import type { Route } from 'next';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { ArrowRightIcon } from '@/components/shell/icons';
import { LoginForm } from './login-form';
import styles from './login.module.css';

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'Email o contraseña con formato inválido.',
  auth: 'Email o contraseña incorrectos.',
};

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERROR_MESSAGES[error] ?? 'No se pudo iniciar sesión.') : null;

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/creatiba-studio-wordmark.png"
              alt="Creatiba Studio"
              className={styles.brandWordmark}
            />
            <h1 className={styles.headline}>
              Tu marca,
              <br />
              multiplicada por <span className={styles.headlineAccent}>IA</span>.
            </h1>
            <p className={styles.brandSub}>
              Del brief al post en minutos. Contenido creativo a escala para las 52 agencias del Grupo — tú solo
              revisas y publicas.
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/creatiba-studio-wordmark.png"
              alt="Creatiba Studio"
              className={styles.cardWordmark}
            />
            <h2 className={styles.formTitle}>Iniciar sesión</h2>
            <p className={styles.formSub}>Accede a tu espacio de trabajo.</p>

            {message && (
              <p role="alert" className={styles.error}>
                {message}
              </p>
            )}

            <LoginForm />

            <p className={styles.formSub} style={{ marginTop: 'var(--space-5)' }}>
              ¿Tu agencia aún no tiene cuenta?{' '}
              <Link href={'/registro' as Route} className={styles.link}>
                Regístrala aquí
                <ArrowRightIcon size={15} />
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
