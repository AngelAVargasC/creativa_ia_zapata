import type { ReactNode } from 'react';
import styles from './shell.module.css';

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: ReactNode;
}

/** Cabecera de seccion: titulo + descripcion opcional + acciones. */
export const PageHeader = ({ title, description, actions }: PageHeaderProps) => (
  <header className={styles.pageHeader}>
    <div>
      <h1 className={styles.pageTitle}>{title}</h1>
      {description && <p className={styles.pageDesc}>{description}</p>}
    </div>
    {actions && <div className={styles.pageActions}>{actions}</div>}
  </header>
);
