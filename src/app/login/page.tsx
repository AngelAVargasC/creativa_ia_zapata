import Link from 'next/link';
import type { Route } from 'next';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { LogoMark } from '@/components/shell/icons';
import { login } from './actions';
import { SubmitButton } from './submit-button';
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
      <aside className={styles.brand}>
        <span className={styles.grain} aria-hidden="true" />
        <div className={styles.brandInner}>
          <div className={styles.brandLogo}>
            <LogoMark size={26} />
            Creatiba
          </div>
          <div>
            <h1 className={styles.headline}>
              Tu marca,
              <br />
              multiplicada por IA.
            </h1>
            <p className={styles.brandSub}>
              Genera copies, guiones y propuestas para las 52 agencias del Grupo. La IA produce; tú revisas, apruebas
              y publicas.
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
          <h2 className={styles.formTitle}>Iniciar sesión</h2>
          <p className={styles.formSub}>Accede a tu espacio de trabajo.</p>

          {message && (
            <p role="alert" className={styles.error}>
              {message}
            </p>
          )}

          <form action={login} className={styles.form}>
            <label className="field">
              <span className="field-label">Email</span>
              <input className="input" name="email" type="email" autoComplete="email" required />
            </label>
            <label className="field">
              <span className="field-label">Contraseña</span>
              <input
                className="input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
              />
            </label>
            <SubmitButton />
          </form>

          <p className={styles.formSub} style={{ marginTop: 'var(--space-5)' }}>
            ¿Tu agencia aún no tiene cuenta?{' '}
            <Link href={'/registro' as Route} className={styles.link}>
              Regístrala aquí
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
