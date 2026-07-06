import type { ReactNode } from 'react';
import styles from './shell.module.css';

interface EmptyStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
}

/** Estado vacio reutilizable: invitacion clara a crear/empezar. */
export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className={styles.empty}>
    <span className={styles.emptyIcon}>{icon}</span>
    <h2 className={styles.emptyTitle}>{title}</h2>
    <p className={styles.emptyDesc}>{description}</p>
    {action && <div className={styles.emptyAction}>{action}</div>}
  </div>
);
